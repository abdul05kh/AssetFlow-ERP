import { assetRepository } from "../repository/asset.repository";
import { CreateCategoryInput, CreateAssetInput, UpdateAssetInput } from "../validator/asset.validator";
import { ConflictError, NotFoundError, BusinessRuleError } from "../../../utils/errors";
import { prisma } from "../../../config/db";
import eventBus from "../../../events/event-bus";
import logger from "../../../utils/logger";

export class AssetService {
  // -------------------------------------------------------------
  // CATEGORIES BUSINESS WORKFLOWS
  // -------------------------------------------------------------

  async createCategory(input: CreateCategoryInput) {
    const existing = await assetRepository.findCategoryByName(input.name);
    if (existing) {
      throw new ConflictError(`Asset category ${input.name} is already in use`, "ASSET_003");
    }
    return assetRepository.createCategory(input);
  }

  async listCategories() {
    return assetRepository.listCategories();
  }

  // -------------------------------------------------------------
  // ASSET REGISTRY BUSINESS WORKFLOWS
  // -------------------------------------------------------------

  async createAsset(input: CreateAssetInput) {
    // 1. Serial number uniqueness check
    if (input.serialNumber) {
      const existing = await assetRepository.findAssetBySerialNumber(input.serialNumber);
      if (existing) {
        throw new ConflictError(`Serial number ${input.serialNumber} is already registered`, "ASSET_001");
      }
    }

    // 2. Category exist check
    const category = await assetRepository.findCategoryById(input.categoryId);
    if (!category || category.status !== "ACTIVE") {
      throw new BusinessRuleError("Target category does not exist or is inactive", "ASSET_004");
    }

    // 3. Department exist check
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
    });
    if (!department || department.status !== "ACTIVE") {
      throw new BusinessRuleError("Target department does not exist or is inactive", "ASSET_005");
    }

    const asset = await assetRepository.createAsset(input);

    // 4. Fire domain events
    eventBus.publish("AssetCreated", { assetId: asset?.id, tag: asset?.tag, name: asset?.name });
    logger.info(`[Asset] Registered new asset: ${asset?.tag} - ${asset?.name}`);

    return asset;
  }

  async getAssetById(id: string) {
    const asset = await assetRepository.findAssetById(id);
    if (!asset) {
      throw new NotFoundError("Asset record not found");
    }
    return asset;
  }

  async getAssetByTag(tag: string) {
    const asset = await assetRepository.findAssetByTag(tag);
    if (!asset) {
      throw new NotFoundError(`Asset with tag ${tag} not found`);
    }
    return asset;
  }

  async updateAsset(id: string, input: UpdateAssetInput) {
    const asset = await this.getAssetById(id);

    // 1. Serial uniqueness if changed
    if (input.serialNumber && input.serialNumber !== asset.serialNumber) {
      const existing = await assetRepository.findAssetBySerialNumber(input.serialNumber);
      if (existing) {
        throw new ConflictError(`Serial number ${input.serialNumber} is already registered`, "ASSET_001");
      }
    }

    // 2. Category check if changed
    if (input.categoryId && input.categoryId !== asset.categoryId) {
      const category = await assetRepository.findCategoryById(input.categoryId);
      if (!category || category.status !== "ACTIVE") {
        throw new BusinessRuleError("Target category does not exist or is inactive", "ASSET_004");
      }
    }

    // 3. Department check if changed
    if (input.departmentId && input.departmentId !== asset.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: input.departmentId },
      });
      if (!department || department.status !== "ACTIVE") {
        throw new BusinessRuleError("Target department does not exist or is inactive", "ASSET_005");
      }
    }

    return assetRepository.updateAsset(id, input);
  }

  async listAssets(query: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: string;
    categoryId?: string;
    departmentId?: string;
    status?: string;
    condition?: string;
    sharedResource?: string;
    location?: string;
  }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);
    const search = query.search;
    const sort = query.sort;
    const order = query.order === "desc" ? "desc" : "asc";
    const categoryId = query.categoryId;
    const departmentId = query.departmentId;
    const status = query.status;
    const condition = query.condition;
    const sharedResource = query.sharedResource ? query.sharedResource === "true" : undefined;
    const location = query.location;

    return assetRepository.listAssets({
      page,
      limit,
      search,
      sort,
      order,
      categoryId,
      departmentId,
      status,
      condition,
      sharedResource,
      location,
    });
  }

  async deleteAsset(id: string) {
    await this.getAssetById(id);

    // Check if asset is currently allocated
    const activeAllocationsCount = await prisma.allocation.count({
      where: {
        assetId: id,
        status: "ACTIVE",
      },
    });

    if (activeAllocationsCount > 0) {
      throw new BusinessRuleError(
        `Cannot delete asset with ${activeAllocationsCount} active allocations. Return the asset first`,
        "ASSET_006"
      );
    }

    // Check if asset has active resource bookings
    const activeBookingsCount = await prisma.resourceBooking.count({
      where: {
        resourceId: id,
        status: { in: ["REQUESTED", "CONFIRMED", "ONGOING"] },
      },
    });

    if (activeBookingsCount > 0) {
      throw new BusinessRuleError(
        `Cannot delete asset with ${activeBookingsCount} active or upcoming resource bookings`,
        "ASSET_007"
      );
    }

    return assetRepository.deleteAsset(id);
  }
}

export const assetService = new AssetService();
export default assetService;
