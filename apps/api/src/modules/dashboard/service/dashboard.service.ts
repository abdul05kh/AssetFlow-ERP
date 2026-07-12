import { prisma } from "../../../config/db";

export class DashboardService {
  async getStats() {
    // 1. Total assets and group by status
    const assetsGroup = await prisma.asset.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { acquisitionCost: true },
    });

    const statusCounts: Record<string, number> = {
      AVAILABLE: 0,
      ALLOCATED: 0,
      UNDER_MAINTENANCE: 0,
      LOST: 0,
      RETIRED: 0,
      DISPOSED: 0,
    };

    let totalAssets = 0;
    let totalAcquisitionCost = 0;

    for (const group of assetsGroup) {
      statusCounts[group.status] = group._count.id;
      totalAssets += group._count.id;
      if (group._sum.acquisitionCost) {
        totalAcquisitionCost += Number(group._sum.acquisitionCost);
      }
    }

    // 2. Active allocations
    const activeAllocations = await prisma.allocation.count({
      where: { status: "ACTIVE" },
    });

    // 3. Maintenance statistics
    const pendingMaintenance = await prisma.maintenanceRequest.count({
      where: { status: { in: ["PENDING", "APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"] } },
    });

    // 4. Pending transfer requests
    const pendingTransfers = await prisma.assetTransfer.count({
      where: { status: "PENDING" },
    });

    // 5. Active/pending bookings
    const pendingBookings = await prisma.resourceBooking.count({
      where: { status: { in: ["REQUESTED", "CONFIRMED", "ONGOING"] } },
    });

    return {
      assets: {
        total: totalAssets,
        byStatus: statusCounts,
        totalValue: totalAcquisitionCost,
      },
      allocations: {
        active: activeAllocations,
      },
      maintenance: {
        active: pendingMaintenance,
      },
      transfers: {
        pending: pendingTransfers,
      },
      bookings: {
        pending: pendingBookings,
      },
    };
  }

  async getAssetsCsv(): Promise<string> {
    const assets = await prisma.asset.findMany({
      include: {
        category: true,
        department: true,
        allocations: {
          where: { status: "ACTIVE" },
          include: { employee: true },
        },
      },
    });

    // Headers
    let csv = "Asset ID,Tag,Name,Serial Number,Category,Department,Status,Condition,Acquisition Cost,Acquisition Date,Current Holder\n";

    for (const asset of assets) {
      const activeAlloc = asset.allocations[0];
      const holderName = activeAlloc?.employee ? activeAlloc.employee.name : "N/A";
      
      const line = [
        asset.id,
        asset.tag,
        `"${asset.name.replace(/"/g, '""')}"`,
        asset.serialNumber || "N/A",
        asset.category.name,
        asset.department.code,
        asset.status,
        asset.condition,
        asset.acquisitionCost ? asset.acquisitionCost.toString() : "0.00",
        asset.acquisitionDate ? asset.acquisitionDate.toISOString() : "N/A",
        `"${holderName.replace(/"/g, '""')}"`,
      ].join(",");

      csv += line + "\n";
    }

    return csv;
  }

  async getMaintenanceCsv(): Promise<string> {
    const tickets = await prisma.maintenanceRequest.findMany({
      include: {
        asset: true,
        requestedBy: true,
        technician: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Headers
    let csv = "Ticket ID,Asset Tag,Asset Name,Status,Priority,Cost,Requested By,Technician,Notes,Created At\n";

    for (const ticket of tickets) {
      const techName = ticket.technician ? ticket.technician.name : "Unassigned";
      
      const line = [
        ticket.id,
        ticket.asset.tag,
        `"${ticket.asset.name.replace(/"/g, '""')}"`,
        ticket.status,
        ticket.priority,
        ticket.cost ? ticket.cost.toString() : "0.00",
        `"${ticket.requestedBy.name.replace(/"/g, '""')}"`,
        `"${techName.replace(/"/g, '""')}"`,
        `"${(ticket.notes || "").replace(/"/g, '""')}"`,
        ticket.createdAt.toISOString(),
      ].join(",");

      csv += line + "\n";
    }

    return csv;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
