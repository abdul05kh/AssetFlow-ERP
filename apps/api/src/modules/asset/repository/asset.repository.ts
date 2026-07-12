import { prisma } from "../../../config/db";
import { CreateCategoryInput, CreateAssetInput, UpdateAssetInput } from "../validator/asset.validator";
import { Decimal } from "@prisma/client/runtime/library";

export class AssetRepository {
  // -------------------------------------------------------------
  // CATEGORIES DATA ACCESS
  // -------------------------------------------------------------

  async createCategory(data: CreateCategoryInput) {
    return prisma.assetCategory.create({
      data,
    });
  }

  async findCategoryById(id: string) {
    return prisma.assetCategory.findUnique({
      where: { id },
    });
  }

  async findCategoryByName(name: string) {
    return prisma.assetCategory.findUnique({
      where: { name },
    });
  }

  async listCategories() {
    return prisma.assetCategory.findMany({
      orderBy: { name: "asc" },
    });
  }

  // -------------------------------------------------------------
  // ASSET REGISTRY DATA ACCESS
  // -------------------------------------------------------------

  async createAsset(data: CreateAssetInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Calculate the next unique Asset Tag code (e.g. AF-000001)
      const lastAsset = await tx.asset.findFirst({
        orderBy: { tag: "desc" },
      });
      
      let nextNum = 1;
      if (lastAsset && lastAsset.tag.startsWith("AF-")) {
        const lastNum = parseInt(lastAsset.tag.substring(3), 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      const tag = `AF-${String(nextNum).padStart(6, "0")}`;

      // 2. Insert the Asset record
      const asset = await tx.asset.create({
        data: {
          tag,
          name: data.name,
          serialNumber: data.serialNumber || null,
          categoryId: data.categoryId,
          departmentId: data.departmentId,
          acquisitionDate: new Date(data.acquisitionDate),
          acquisitionCost: new Decimal(data.acquisitionCost),
          currentLocation: data.currentLocation,
          condition: data.condition || "NEW",
          sharedResource: data.sharedResource || false,
          status: "AVAILABLE",
          warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
          description: data.description || null,
        },
      });

      // 3. Create any associated Asset Images
      if (data.images && data.images.length > 0) {
        await tx.assetImage.createMany({
          data: data.images.map((url) => ({
            assetId: asset.id,
            url,
          })),
        });
      }

      return tx.asset.findUnique({
        where: { id: asset.id },
        include: {
          category: true,
          department: true,
          images: true,
        },
      });
    });
  }

  async findAssetById(id: string) {
    return prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        images: true,
        allocations: {
          where: { status: "ACTIVE" },
          include: { employee: true, department: true },
        },
        maintenance: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async findAssetByTag(tag: string) {
    return prisma.asset.findUnique({
      where: { tag },
      include: {
        category: true,
        department: true,
        images: true,
      },
    });
  }

  async findAssetBySerialNumber(serialNumber: string) {
    return prisma.asset.findUnique({
      where: { serialNumber },
    });
  }

  async updateAsset(id: string, data: UpdateAssetInput) {
    return prisma.$transaction(async (tx) => {
      const updateData: any = {
        name: data.name,
        serialNumber: data.serialNumber,
        categoryId: data.categoryId,
        departmentId: data.departmentId,
        acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : undefined,
        acquisitionCost: data.acquisitionCost ? new Decimal(data.acquisitionCost) : undefined,
        currentLocation: data.currentLocation,
        condition: data.condition,
        status: data.status,
        warrantyExpiry: data.warrantyExpiry === null ? null : (data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined),
        description: data.description,
      };

      // Clean undefined keys
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      const asset = await tx.asset.update({
        where: { id },
        data: updateData,
      });

      // Update images if provided
      if (data.images) {
        // Delete current images and replace
        await tx.assetImage.deleteMany({ where: { assetId: id } });
        if (data.images.length > 0) {
          await tx.assetImage.createMany({
            data: data.images.map((url) => ({
              assetId: id,
              url,
            })),
          });
        }
      }

      return tx.asset.findUnique({
        where: { id: asset.id },
        include: {
          category: true,
          department: true,
          images: true,
        },
      });
    });
  }

  async listAssets(params: {
    page: number;
    limit: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    categoryId?: string;
    departmentId?: string;
    status?: string;
    condition?: string;
    sharedResource?: boolean;
    location?: string;
  }) {
    const { page, limit, search, sort, order, categoryId, departmentId, status, condition, sharedResource, location } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (condition) where.condition = condition;
    if (categoryId) where.categoryId = categoryId;
    if (departmentId) where.departmentId = departmentId;
    if (sharedResource !== undefined) where.sharedResource = sharedResource;
    if (location) where.currentLocation = { contains: location };
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tag: { contains: search } },
        { serialNumber: { contains: search } },
        { currentLocation: { contains: search } },
      ];
    }

    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [items, totalCount] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          department: true,
          images: true,
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return {
      items,
      totalCount,
    };
  }

  async deleteAsset(id: string) {
    return prisma.asset.delete({
      where: { id },
    });
  }
}

export const assetRepository = new AssetRepository();
export default assetRepository;
