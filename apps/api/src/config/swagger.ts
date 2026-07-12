import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AssetFlow Enterprise ERP API",
      version: "1.0.0",
      description: "Production-grade API documentation mapping the asset registries, allocations, reservations, transfers, and compliance audits for AssetFlow ERP.",
    },
    servers: [
      {
        url: "http://localhost:4000/api/v1",
        description: "Local Development API Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JSON Web Token (JWT) retrieved from /auth/login as a Bearer token.",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Paths to files containing OpenAPI JSDoc annotations
  apis: [
    "./src/routes/*.ts",
    "./src/modules/**/*.ts",
    "./src/config/*.ts",
    "./src/utils/*.ts",
    "./src/main.ts",
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
