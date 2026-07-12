import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("[SEED] Starting database seeding...");

  // 1. Clean Database in order of dependencies (to avoid foreign key constraint errors)
  await prisma.systemSetting.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.auditItem.deleteMany({});
  await prisma.audit.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.resourceBooking.deleteMany({});
  await prisma.assetTransfer.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.assetImage.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});

  console.log("[SEED] Database cleared.");

  // 2. Create Roles
  const roles = {
    admin: await prisma.role.create({
      data: { name: "Administrator", code: "ADMIN", description: "Full system administration and settings access" },
    }),
    manager: await prisma.role.create({
      data: { name: "Asset Manager", code: "ASSET_MANAGER", description: "Registers assets, allocates resources, and manages maintenance" },
    }),
    deptHead: await prisma.role.create({
      data: { name: "Department Head", code: "DEPT_HEAD", description: "Approves departmental transfers and bookings" },
    }),
    employee: await prisma.role.create({
      data: { name: "Employee", code: "EMPLOYEE", description: "Standard worker with self-service request actions" },
    }),
    auditor: await prisma.role.create({
      data: { name: "Auditor", code: "AUDITOR", description: "Conducts scheduled asset audits and registers discrepancies" },
    }),
    technician: await prisma.role.create({
      data: { name: "Technician", code: "TECHNICIAN", description: "Updates and resolves maintenance ticket events" },
    }),
  };

  console.log(`[SEED] Created ${Object.keys(roles).length} roles.`);

  // 3. Create Permissions
  const permissionsList = [
    // Users & Roles
    { name: "Create User", code: "USER_CREATE", description: "Create user records" },
    { name: "View Users", code: "USER_READ", description: "List and view users details" },
    { name: "Update User", code: "USER_UPDATE", description: "Modify user status and roles" },
    
    // Departments
    { name: "Manage Departments", code: "DEPT_MANAGE", description: "CRUD operations on departments" },
    
    // Asset Category
    { name: "Manage Categories", code: "CAT_MANAGE", description: "CRUD operations on asset categories" },
    
    // Assets Registry
    { name: "Create Asset", code: "ASSET_CREATE", description: "Register new asset tag entries" },
    { name: "View Assets", code: "ASSET_READ", description: "View asset catalogs" },
    { name: "Update Asset", code: "ASSET_UPDATE", description: "Update asset condition and metadata" },
    { name: "Delete Asset", code: "ASSET_DELETE", description: "Retire or dispose assets" },
    
    // Allocations
    { name: "Manage Allocations", code: "ALLOC_MANAGE", description: "Assign assets to users or departments" },
    { name: "Request Return", code: "ALLOC_RETURN", description: "Initiate returning of allocated assets" },
    
    // Transfers
    { name: "Request Transfer", code: "TRANSFER_REQUEST", description: "Request transferring asset to another user" },
    { name: "Approve Transfer", code: "TRANSFER_APPROVE", description: "Approve asset transfer transactions" },
    
    // Bookings
    { name: "Book Resource", code: "BOOK_CREATE", description: "Submit shared resources reservations" },
    { name: "Approve Booking", code: "BOOK_APPROVE", description: "Approve or decline bookings request" },
    
    // Maintenance
    { name: "Request Maintenance", code: "MAINT_REQUEST", description: "Report damaged assets or request repairs" },
    { name: "Approve Maintenance", code: "MAINT_APPROVE", description: "Approve tickets and assign technician resources" },
    { name: "Resolve Maintenance", code: "MAINT_RESOLVE", description: "Update repair stages and mark as resolved" },
    
    // Audits
    { name: "Manage Audits", code: "AUDIT_MANAGE", description: "Design audit cycles and view discrepancy sheets" },
    { name: "Perform Audit", code: "AUDIT_EXECUTE", description: "Execute checklist entries as auditor" },
    
    // Settings & Reports
    { name: "View Reports", code: "REPORTS_VIEW", description: "Access asset utilization and audit reports" },
    { name: "Update Settings", code: "SETTINGS_UPDATE", description: "Modify global settings variables" },
  ];

  const dbPermissions: { [key: string]: any } = {};
  for (const perm of permissionsList) {
    dbPermissions[perm.code] = await prisma.permission.create({ data: perm });
  }

  console.log(`[SEED] Created ${Object.keys(dbPermissions).length} permissions.`);

  // 4. RolePermission Associations
  // ADMIN gets all permissions
  for (const permCode of Object.keys(dbPermissions)) {
    await prisma.rolePermission.create({
      data: { roleId: roles.admin.id, permissionId: dbPermissions[permCode].id },
    });
  }

  // ASSET_MANAGER permissions
  const managerPerms = [
    "ASSET_CREATE", "ASSET_READ", "ASSET_UPDATE", "ALLOC_MANAGE", "ALLOC_RETURN",
    "TRANSFER_APPROVE", "BOOK_APPROVE", "MAINT_APPROVE", "AUDIT_MANAGE", "REPORTS_VIEW"
  ];
  for (const code of managerPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roles.manager.id, permissionId: dbPermissions[code].id },
    });
  }

  // DEPT_HEAD permissions
  const headPerms = [
    "USER_READ", "ASSET_READ", "TRANSFER_REQUEST", "TRANSFER_APPROVE", "BOOK_CREATE", "BOOK_APPROVE", "MAINT_REQUEST"
  ];
  for (const code of headPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roles.deptHead.id, permissionId: dbPermissions[code].id },
    });
  }

  // EMPLOYEE permissions
  const empPerms = [
    "ASSET_READ", "TRANSFER_REQUEST", "BOOK_CREATE", "MAINT_REQUEST"
  ];
  for (const code of empPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roles.employee.id, permissionId: dbPermissions[code].id },
    });
  }

  // AUDITOR permissions
  const auditorPerms = [
    "ASSET_READ", "AUDIT_EXECUTE", "REPORTS_VIEW"
  ];
  for (const code of auditorPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roles.auditor.id, permissionId: dbPermissions[code].id },
    });
  }

  // TECHNICIAN permissions
  const techPerms = [
    "ASSET_READ", "MAINT_RESOLVE"
  ];
  for (const code of techPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roles.technician.id, permissionId: dbPermissions[code].id },
    });
  }

  console.log("[SEED] Role-Permission mappings defined.");

  // 5. Create Departments
  const deptAdmin = await prisma.department.create({
    data: { name: "Administration", code: "ADM", description: "Global operations and configurations department" },
  });
  const deptEngineering = await prisma.department.create({
    data: { name: "Engineering & Development", code: "ENG", description: "Product engineers, hardware builders and developers" },
  });
  const deptIT = await prisma.department.create({
    data: { name: "Information Technology", code: "IT", description: "Company IT support, networking, server assets" },
  });
  const deptHR = await prisma.department.create({
    data: { name: "Human Resources", code: "HR", description: "Personnel handling, hiring, and workspace environment" },
  });

  console.log("[SEED] Core departments generated.");

  // 6. Create Default Administrative User
  const passwordHash = await argon2.hash("Password123");
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@assetflow.erp",
      passwordHash,
      name: "System Administrator",
      phone: "+1 555-0199",
      designation: "Chief Administrator Officer",
      status: "ACTIVE",
      departmentId: deptAdmin.id,
    },
  });

  await prisma.userRole.create({
    data: { userId: adminUser.id, roleId: roles.admin.id },
  });

  // Create additional users for simulation
  const managerUser = await prisma.user.create({
    data: {
      email: "manager@assetflow.erp",
      passwordHash,
      name: "Jane Smith",
      phone: "+1 555-0120",
      designation: "Asset Inventory Director",
      status: "ACTIVE",
      departmentId: deptIT.id,
    },
  });
  await prisma.userRole.create({
    data: { userId: managerUser.id, roleId: roles.manager.id },
  });

  const empUser = await prisma.user.create({
    data: {
      email: "employee@assetflow.erp",
      passwordHash,
      name: "John Doe",
      phone: "+1 555-0145",
      designation: "Software Engineer",
      status: "ACTIVE",
      departmentId: deptEngineering.id,
    },
  });
  await prisma.userRole.create({
    data: { userId: empUser.id, roleId: roles.employee.id },
  });

  const techUser = await prisma.user.create({
    data: {
      email: "technician@assetflow.erp",
      passwordHash,
      name: "Bob Builder",
      phone: "+1 555-0160",
      designation: "Hardware Repair Technician",
      status: "ACTIVE",
      departmentId: deptIT.id,
    },
  });
  await prisma.userRole.create({
    data: { userId: techUser.id, roleId: roles.technician.id },
  });

  const auditorUser = await prisma.user.create({
    data: {
      email: "auditor@assetflow.erp",
      passwordHash,
      name: "Alice Inspection",
      phone: "+1 555-0182",
      designation: "Internal Compliance Auditor",
      status: "ACTIVE",
      departmentId: deptAdmin.id,
    },
  });
  await prisma.userRole.create({
    data: { userId: auditorUser.id, roleId: roles.auditor.id },
  });

  console.log("[SEED] Initial seed users initialized.");

  // 7. Create Asset Categories
  const categories = [
    { name: "IT Hardware", description: "Laptops, computers, displays, servers", sharedResource: false, defaultMaintenanceInterval: 90 },
    { name: "Furniture", description: "Desks, chairs, drawers, cabins", sharedResource: false, defaultMaintenanceInterval: 360 },
    { name: "Meeting Rooms", description: "Shared conferencing rooms and hubs", sharedResource: true, defaultMaintenanceInterval: 30 },
    { name: "Company Vehicles", description: "Fleet and company cars", sharedResource: true, defaultMaintenanceInterval: 180 },
    { name: "Office Equipment", description: "Printers, projectors, paper shredders", sharedResource: true, defaultMaintenanceInterval: 60 },
  ];

  for (const cat of categories) {
    await prisma.assetCategory.create({ data: cat });
  }

  console.log("[SEED] Asset categories complete.");

  // 8. Create Initial Vendors
  const vendors = [
    { name: "Dell Technologies Inc.", contactName: "Dell B2B Representative", email: "dell@vendor.assetflow", phone: "+1 800-456-3355", address: "Round Rock, Texas" },
    { name: "Steelcase Furniture Corp.", contactName: "Steelcase Sales Executive", email: "steelcase@vendor.assetflow", phone: "+1 800-333-9939", address: "Grand Rapids, Michigan" },
    { name: "Toyota B2B Corporate", contactName: "Toyota Fleet Coordinator", email: "toyota@vendor.assetflow", phone: "+1 800-331-4331", address: "Plano, Texas" },
  ];

  for (const ven of vendors) {
    await prisma.vendor.create({ data: ven });
  }

  console.log("[SEED] Vendor directory initialized.");

  // 9. Initial System Settings
  const settings = [
    { key: "session_timeout_minutes", value: "30", description: "Web session inactivity expiration duration" },
    { key: "max_booking_hours", value: "24", description: "Maximum reservation block allowed for shared assets" },
    { key: "default_page_limit", value: "10", description: "System page listing count limit" },
    { key: "allow_self_service_transfers", value: "false", description: "Whether employees can exchange assets without department head approval" },
  ];

  for (const set of settings) {
    await prisma.systemSetting.create({ data: set });
  }

  console.log("[SEED] Global system configurations loaded.");
  console.log("[SEED] Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("[SEED] Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
