import { prisma } from "../../../config/db";
import { ReturnAssetInput } from "../validator/return.validator";
import { BusinessRuleError } from "../../../utils/errors";

export class ReturnRepository {
  async executeReturn(data: ReturnAssetInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch active allocation for asset
      const allocation = await tx.allocation.findFirst({
        where: {
          assetId: data.assetId,
          status: "ACTIVE",
        },
        include: {
          asset: true,
        },
      });

      if (!allocation) {
        throw new BusinessRuleError("Asset is not currently allocated or active", "RETURN_001");
      }

      const now = new Date();

      // 2. Close allocation
      const updatedAllocation = await tx.allocation.update({
        where: { id: allocation.id },
        data: {
          status: "RETURNED",
          actualReturnDate: now,
          conditionOnReturn: data.conditionOnReturn,
          notes: data.notes || null,
        },
        include: {
          asset: true,
          employee: true,
          department: true,
        },
      });

      // 3. Update asset details (status is reset to AVAILABLE and condition is updated)
      await tx.asset.update({
        where: { id: data.assetId },
        data: {
          status: "AVAILABLE",
          condition: data.conditionOnReturn,
        },
      });

      return updatedAllocation;
    });
  }
}

export const returnRepository = new ReturnRepository();
export default returnRepository;
