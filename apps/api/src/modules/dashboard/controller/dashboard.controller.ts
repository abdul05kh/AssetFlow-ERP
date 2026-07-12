import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../service/dashboard.service";

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getStats();
      res.status(200).json({
        success: true,
        message: "Dashboard summary statistics retrieved",
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async exportAssetsCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await dashboardService.getAssetsCsv();
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="assetflow-assets-report.csv"');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }

  async exportMaintenanceCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await dashboardService.getMaintenanceCsv();

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="assetflow-maintenance-report.csv"');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;
