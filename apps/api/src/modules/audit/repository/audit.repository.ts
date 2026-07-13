import { prisma, TransactionClient } from "../../../config/db";
import { CreateAuditInput, VerifyAuditItemInput } from "../validator/audit.validator";
import { BusinessRuleError } from "../../../utils/errors";

export class AuditRepository {
  async create(data: CreateAuditInput) {
    // 1. Discover all assets currently mapped to this department outside transaction
    const departmentAssets = await prisma.asset.findMany({
      where: {
        departmentId: data.departmentId,
        status: { notIn: ["RETIRED", "DISPOSED"] },
      },
    });

    const auditId = await prisma.$transaction(async (tx: TransactionClient) => {
      // 2. Create the Audit Cycle record
      const audit = await tx.audit.create({
        data: {
          name: data.name,
          departmentId: data.departmentId,
          location: data.location,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          auditorId: data.auditorId,
          status: "ASSIGNED",
        },
      });

      // 3. Auto-populate audit checklist items
      if (departmentAssets.length > 0) {
        await tx.auditItem.createMany({
          data: departmentAssets.map((asset) => ({
            auditId: audit.id,
            assetId: asset.id,
            status: "VERIFIED", // Initial status (assumed verified unless auditor updates otherwise)
          })),
        });
      }

      return audit.id;
    });

    return prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        department: true,
        auditor: true,
        items: {
          include: { asset: true },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.audit.findUnique({
      where: { id },
      include: {
        department: true,
        auditor: true,
        items: {
          include: { asset: true },
        },
      },
    });
  }

  async findItemById(itemId: string) {
    return prisma.auditItem.findUnique({
      where: { id: itemId },
      include: {
        asset: true,
        audit: true,
      },
    });
  }

  async updateItem(itemId: string, data: VerifyAuditItemInput) {
    return prisma.auditItem.update({
      where: { id: itemId },
      data: {
        status: data.status,
        discrepancyNotes: data.discrepancyNotes || null,
        verifiedAt: new Date(),
      },
      include: {
        asset: true,
        audit: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.audit.update({
      where: { id },
      data: { status },
      include: {
        department: true,
        auditor: true,
        items: {
          include: { asset: true },
        },
      },
    });
  }

  async close(id: string) {
    // 1. Fetch audit details outside transaction
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: { items: { include: { asset: true } } },
    });

    if (!audit) {
      throw new BusinessRuleError("Audit cycle not found", "AUDIT_NOT_FOUND");
    }

    if (audit.status === "CLOSED") {
      throw new BusinessRuleError("Audit cycle is already closed", "AUDIT_002");
    }

    // Check if there are any discrepancies (missing or damaged items)
    const hasDiscrepancy = audit.items.some((item) => ["MISSING", "DAMAGED"].includes(item.status));
    const finalStatus = hasDiscrepancy ? "DISCREPANCY" : "CLOSED";

    const auditId = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Process asset updates based on checklist outcomes
      for (const item of audit.items) {
        if (item.status === "MISSING") {
          // Lock status to LOST
          await tx.asset.update({
            where: { id: item.assetId },
            data: { status: "LOST" },
          });
          
          // Close active allocations if any
          await tx.allocation.updateMany({
            where: { assetId: item.assetId, status: "ACTIVE" },
            data: { status: "RETURNED", actualReturnDate: new Date(), notes: "Marked missing during audit cycle" },
          });
        } else if (item.status === "DAMAGED") {
          // Lock status to UNDER_MAINTENANCE and spawn ticket if not already under maintenance
          if (item.asset.status !== "UNDER_MAINTENANCE") {
            await tx.asset.update({
              where: { id: item.assetId },
              data: { status: "UNDER_MAINTENANCE", condition: "DAMAGED" },
            });

            // Create maintenance request
            await tx.maintenanceRequest.create({
              data: {
                assetId: item.assetId,
                requestedById: audit.auditorId,
                description: `Auto-generated maintenance ticket triggered by audit cycle discrepancies. Notes: ${item.discrepancyNotes || "Reported damaged during audit inspection"}`,
                priority: "HIGH",
                status: "PENDING",
              },
            });
          }
        }
      }

      // 2. Set audit cycle status
      const updated = await tx.audit.update({
        where: { id },
        data: { status: "CLOSED" },
      });

      return updated.id;
    });

    const updatedAudit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        department: true,
        auditor: true,
        items: {
          include: { asset: true },
        },
      },
    });

    return {
      audit: updatedAudit!,
      hasDiscrepancy,
    };
  }

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    departmentId?: string;
    auditorId?: string;
    status?: string;
  }) {
    const { page, limit, search, sort, order, departmentId, auditorId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (auditorId) where.auditorId = auditorId;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [items, totalCount] = await Promise.all([
      prisma.audit.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          department: true,
          auditor: true,
          items: {
            include: { asset: true },
          },
        },
      }),
      prisma.audit.count({ where }),
    ]);

    return {
      items,
      totalCount,
    };
  }
}

export const auditRepository = new AuditRepository();
export default auditRepository;
