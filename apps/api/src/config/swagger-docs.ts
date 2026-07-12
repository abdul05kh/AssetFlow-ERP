/**
 * @openapi
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Resource validation failed"
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "VALIDATION_ERROR"
 *               field:
 *                 type: string
 *                 example: "email"
 *               message:
 *                 type: string
 *                 example: "Invalid email format"
 * 
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         designation:
 *           type: string
 *         status:
 *           type: string
 *           example: "ACTIVE"
 *         departmentId:
 *           type: string
 *           format: uuid
 * 
 *     Asset:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tag:
 *           type: string
 *           example: "AF-000001"
 *         name:
 *           type: string
 *         serialNumber:
 *           type: string
 *         categoryId:
 *           type: string
 *           format: uuid
 *         departmentId:
 *           type: string
 *           format: uuid
 *         acquisitionDate:
 *           type: string
 *           format: date-time
 *         acquisitionCost:
 *           type: string
 *         currentLocation:
 *           type: string
 *         condition:
 *           type: string
 *           example: "GOOD"
 *         sharedResource:
 *           type: boolean
 *         status:
 *           type: string
 *           example: "AVAILABLE"
 * 
 *     Allocation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         assetId:
 *           type: string
 *           format: uuid
 *         employeeId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         departmentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         allocationDate:
 *           type: string
 *           format: date-time
 *         expectedReturnDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         status:
 *           type: string
 *           example: "ACTIVE"
 * 
 *     ResourceBooking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         resourceId:
 *           type: string
 *           format: uuid
 *         employeeId:
 *           type: string
 *           format: uuid
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         purpose:
 *           type: string
 *         status:
 *           type: string
 *           example: "REQUESTED"
 * 
 *     AssetTransfer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         assetId:
 *           type: string
 *           format: uuid
 *         allocationId:
 *           type: string
 *           format: uuid
 *         currentHolderId:
 *           type: string
 *           format: uuid
 *         targetHolderId:
 *           type: string
 *           format: uuid
 *         requestedById:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           example: "PENDING"
 * 
 *     MaintenanceRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         assetId:
 *           type: string
 *           format: uuid
 *         requestedById:
 *           type: string
 *           format: uuid
 *         technicianId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         description:
 *           type: string
 *         priority:
 *           type: string
 *           example: "MEDIUM"
 *         status:
 *           type: string
 *           example: "PENDING"
 *         cost:
 *           type: string
 *           nullable: true
 * 
 *     Audit:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         departmentId:
 *           type: string
 *           format: uuid
 *         location:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         auditorId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           example: "CREATED"
 * 
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         message:
 *           type: string
 *         eventType:
 *           type: string
 *           example: "ALLOCATION"
 *         isRead:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Authenticate user session
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@assetflow.erp
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Authentication successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /assets:
 *   post:
 *     summary: Register physical asset
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, categoryId, departmentId, acquisitionDate, acquisitionCost, currentLocation]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Lenovo ThinkPad P1
 *               serialNumber:
 *                 type: string
 *                 example: SN-LNV-87513
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *               acquisitionDate:
 *                 type: string
 *                 format: date-time
 *               acquisitionCost:
 *                 type: number
 *                 example: 2200.00
 *               currentLocation:
 *                 type: string
 *                 example: Floor 3 IT Wing
 *               condition:
 *                 type: string
 *                 enum: [NEW, GOOD, FAIR, POOR]
 *                 default: NEW
 *               sharedResource:
 *                 type: boolean
 *                 default: false
 *               description:
 *                 type: string
 *     responses:
 *       210:
 *         description: Asset registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *   get:
 *     summary: List physical assets inventory
 *     tags: [Assets]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 * 
 * /allocations:
 *   post:
 *     summary: Allocate asset to employee or department
 *     tags: [Allocations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetId]
 *             properties:
 *               assetId:
 *                 type: string
 *                 format: uuid
 *               employeeId:
 *                 type: string
 *                 format: uuid
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *               expectedReturnDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       210:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Allocation'
 * 
 * /returns:
 *   post:
 *     summary: Return asset into inventory
 *     tags: [Returns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetId, conditionOnReturn]
 *             properties:
 *               assetId:
 *                 type: string
 *                 format: uuid
 *               conditionOnReturn:
 *                 type: string
 *                 enum: [NEW, GOOD, FAIR, POOR, DAMAGED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return completed
 * 
 * /maintenance:
 *   post:
 *     summary: Raise asset maintenance ticket
 *     tags: [Maintenance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetId, description]
 *             properties:
 *               assetId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       210:
 *         description: Ticket created
 * 
 * /audits:
 *   post:
 *     summary: Initiate department audit cycle
 *     tags: [Audits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, departmentId, location, startDate, endDate, auditorId]
 *             properties:
 *               name:
 *                 type: string
 *               departmentId:
 *                 type: string
 *                 format: uuid
 *               location:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               auditorId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       210:
 *         description: Audit initiated
 * 
 * /dashboard/stats:
 *   get:
 *     summary: Fetch overview counts and stats
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Success
 */
export const API_DOCS_DECLARATION = true;
