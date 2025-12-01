const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NetisTrackGh Backend API',
      version: '1.0.0',
      description: 'Complete API documentation for NetisTrackGh - Site monitoring and management system',
      contact: {
        name: 'API Support',
        email: 'support@netistrackgh.com'
      },
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://your-production-url.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter Firebase JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        // User Schema
        User: {
          type: 'object',
          properties: {
            uid: {
              type: 'string',
              description: 'Firebase User ID'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            role: {
              type: 'string',
              enum: ['technician', 'supervisor', 'admin'],
              example: 'technician'
            },
            firstName: {
              type: 'string',
              example: 'John'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            phoneNumber: {
              type: 'string',
              example: '+233123456789'
            },
            assignedSites: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Site Schema
        Site: {
          type: 'object',
          required: ['name', 'location', 'acSystem', 'dcSystem', 'generator', 'fuel', 'maintenanceSchedule'],
          properties: {
            siteId: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              description: '6-digit unique Site ID (e.g., 600545)',
              example: '600545'
            },
            id: {
              type: 'string',
              description: 'Same as siteId, maintained for consistency'
            },
            name: {
              type: 'string',
              description: 'Site name',
              example: 'Accra Central Site'
            },
            location: {
              type: 'object',
              properties: {
                address: {
                  type: 'string',
                  example: '123 Main Street, Accra'
                },
                coordinates: {
                  type: 'object',
                  properties: {
                    latitude: {
                      type: 'number',
                      example: 5.6037
                    },
                    longitude: {
                      type: 'number',
                      example: -0.1870
                    }
                  }
                }
              }
            },
            acSystem: {
              type: 'object',
              properties: {
                capacity: {
                  type: 'number',
                  example: 50
                },
                voltage: {
                  type: 'string',
                  enum: ['110V', '220V', '240V'],
                  example: '220V'
                },
                phase: {
                  type: 'string',
                  enum: ['Single', 'Three'],
                  example: 'Single'
                }
              }
            },
            dcSystem: {
              type: 'object',
              properties: {
                batteryCapacity: {
                  type: 'number',
                  example: 200
                },
                solarCapacity: {
                  type: 'number',
                  example: 5
                },
                inverterCapacity: {
                  type: 'number',
                  example: 3
                }
              }
            },
            generator: {
              type: 'object',
              properties: {
                capacity: {
                  type: 'number',
                  example: 100
                },
                fuelTankCapacity: {
                  type: 'number',
                  example: 500
                },
                currentRunHours: {
                  type: 'number',
                  example: 1500
                },
                lastMaintenanceHours: {
                  type: 'number',
                  example: 1200
                }
              }
            },
            fuel: {
              type: 'object',
              properties: {
                currentLevel: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  example: 75
                },
                consumptionRate: {
                  type: 'number',
                  example: 10.5
                },
                lastRefuelDate: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            },
            maintenanceSchedule: {
              type: 'object',
              properties: {
                nextMaintenance: {
                  type: 'string',
                  format: 'date-time'
                },
                maintenanceInterval: {
                  type: 'number',
                  example: 500
                },
                lastMaintenance: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            },
            assignedTechnician: {
              type: 'string',
              description: 'Firebase UID of assigned technician'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Fuel Log Schema
        FuelLog: {
          type: 'object',
          required: ['siteId', 'technicianId', 'fuelAmount', 'currentLevel'],
          properties: {
            id: {
              type: 'string',
              description: 'Auto-generated fuel log ID'
            },
            siteId: {
              type: 'string',
              description: 'Site ID'
            },
            technicianId: {
              type: 'string',
              description: 'Technician ID who recorded the log'
            },
            fuelAmount: {
              type: 'number',
              description: 'Amount of fuel added in liters',
              example: 50
            },
            fuelCost: {
              type: 'number',
              description: 'Cost of the fuel',
              example: 450.50
            },
            currentLevel: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Current fuel level percentage',
              example: 85
            },
            previousLevel: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Previous fuel level percentage',
              example: 35
            },
            refuelDate: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time of refueling'
            },
            generatorHours: {
              type: 'number',
              description: 'Generator run hours at time of refuel',
              example: 1500
            },
            notes: {
              type: 'string',
              description: 'Additional notes about the refuel',
              example: 'Refueled during routine maintenance'
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether the log has been verified by supervisor'
            },
            verifiedBy: {
              type: 'string',
              description: 'User ID of the verifier'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Maintenance Log Schema
        MaintenanceLog: {
          type: 'object',
          required: ['siteId', 'technicianId', 'maintenanceType', 'title', 'description'],
          properties: {
            id: {
              type: 'string',
              description: 'Auto-generated maintenance log ID'
            },
            siteId: {
              type: 'string',
              description: 'Site ID'
            },
            technicianId: {
              type: 'string',
              description: 'Technician ID who performed maintenance'
            },
            maintenanceType: {
              type: 'string',
              enum: ['routine', 'corrective', 'preventive', 'emergency'],
              description: 'Type of maintenance performed',
              example: 'preventive'
            },
            title: {
              type: 'string',
              description: 'Maintenance title',
              example: 'Generator Oil Change'
            },
            description: {
              type: 'string',
              description: 'Description of maintenance work',
              example: 'Routine oil change and filter replacement'
            },
            partsUsed: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { 
                    type: 'string',
                    example: 'Engine Oil'
                  },
                  quantity: { 
                    type: 'number',
                    example: 5
                  },
                  cost: { 
                    type: 'number',
                    example: 150.00
                  },
                  partNumber: {
                    type: 'string',
                    example: 'OIL-5W30-1L'
                  }
                }
              }
            },
            laborHours: {
              type: 'number',
              description: 'Hours spent on maintenance',
              example: 2.5
            },
            totalCost: {
              type: 'number',
              description: 'Total cost of maintenance',
              example: 300.00
            },
            completedDate: {
              type: 'string',
              format: 'date-time',
              description: 'Date when maintenance was completed'
            },
            nextMaintenanceDate: {
              type: 'string',
              format: 'date-time',
              description: 'Date for next scheduled maintenance'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
              description: 'Maintenance status',
              example: 'completed'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              example: 'medium'
            },
            generatorHours: {
              type: 'number',
              description: 'Generator hours at time of maintenance',
              example: 1520
            },
            notes: {
              type: 'string',
              description: 'Additional maintenance notes'
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether maintenance is verified by supervisor'
            },
            verifiedBy: {
              type: 'string',
              description: 'User ID of verifier'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Sync Queue Schema
        SyncQueue: {
          type: 'object',
          required: ['operations', 'lastSyncTimestamp', 'deviceId'],
          properties: {
            operations: {
              type: 'array',
              description: 'List of operations to sync',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['create', 'update', 'delete']
                  },
                  collection: {
                    type: 'string',
                    example: 'fuelLogs'
                  },
                  documentId: {
                    type: 'string',
                    description: 'Document ID (for update/delete operations)'
                  },
                  data: {
                    type: 'object',
                    description: 'Document data (for create/update operations)'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  },
                  offlineId: {
                    type: 'string',
                    description: 'ID generated offline for reference'
                  }
                }
              }
            },
            lastSyncTimestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of last successful sync'
            },
            deviceId: {
              type: 'string',
              description: 'Unique device identifier'
            },
            appVersion: {
              type: 'string',
              description: 'App version for debugging'
            },
            deviceInfo: {
              type: 'object',
              description: 'Device information object'
            }
          }
        },

        // Sync Status Schema
        SyncStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['never_synced', 'synced', 'syncing', 'error'],
              example: 'synced'
            },
            lastSync: {
              type: 'string',
              format: 'date-time'
            },
            pendingChanges: {
              type: 'integer',
              description: 'Number of pending changes to sync',
              example: 0
            },
            deviceId: {
              type: 'string'
            },
            appVersion: {
              type: 'string'
            },
            lastSyncStats: {
              type: 'object',
              properties: {
                successful: {
                  type: 'integer',
                  example: 5
                },
                conflicts: {
                  type: 'integer',
                  example: 0
                },
                failed: {
                  type: 'integer',
                  example: 0
                }
              }
            }
          }
        },

        RefreshToken: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Refresh token from previous authentication'
            }
          }
        },
        PasswordReset: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email'
            }
          }
        },
        ChangePassword: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              format: 'password'
            },
            newPassword: {
              type: 'string',
              format: 'password',
              minLength: 6
            }
          }
        },
        SecurityLog: {
          type: 'object',
          required: ['event'],
          properties: {
            event: {
              type: 'string',
              example: 'login_success'
            },
            userId: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            ip: {
              type: 'string'
            },
            userAgent: {
              type: 'string'
            },
            details: {
              type: 'object'
            }
          }
        },
        Logout: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              example: 'user_initiated'
            },
            deviceId: {
              type: 'string'
            }
          }
        },

        // Error Schema
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'array',
              description: 'Detailed error information',
              items: {
                type: 'object'
              }
            },
            stack: {
              type: 'string',
              description: 'Stack trace (development only)'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Authentication required',
                code: 'UNAUTHENTICATED'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Insufficient permissions',
                code: 'FORBIDDEN'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: [
                  {
                    field: 'name',
                    message: '"name" is required'
                  }
                ]
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Site not found',
                code: 'SITE_NOT_FOUND'
              }
            }
          }
        },
        ConflictError: {
          description: 'Resource conflict',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Resource already exists',
                code: 'CONFLICT'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Too many requests from this IP, please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
              }
            }
          }
        },
        InvalidCredentials: {
      description: 'Invalid email or password',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
          },
          example: {
            error: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS'
          }
        }
      }
    },
    MissingCredentials: {
      description: 'Missing required credentials',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
          },
          example: {
            error: 'Email and password are required',
            code: 'MISSING_CREDENTIALS'
          }
        }
      }
    }
      },
      parameters: {
        SiteId: {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Site ID'
        },
        Limit: {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            default: 50
          },
          description: 'Number of items to return'
        },
        Offset: {
          name: 'offset',
          in: 'query',
          schema: {
            type: 'integer',
            default: 0
          },
          description: 'Number of items to skip'
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and management'
      },
      {
        name: 'Sites',
        description: 'Site management operations'
      },
      {
        name: 'Fuel',
        description: 'Fuel management and consumption tracking'
      },
      {
        name: 'Maintenance',
        description: 'Maintenance management and scheduling'
      },
      {
        name: 'Sync',
        description: 'Offline data synchronization'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js'
  ]
};

// Generate Swagger specs
const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };