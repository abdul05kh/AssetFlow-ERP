import { prisma } from "../config/db";

async function check() {
  const count = await prisma.auditLog.count();
  console.log(`[AuditCheck] Total logs found: ${count}`);
  const logs = await prisma.auditLog.findMany({
    take: 5,
    orderBy: { timestamp: "desc" },
  });
  console.log("[AuditCheck] Last 5 logs:\n", JSON.stringify(logs, null, 2));
}

check();
