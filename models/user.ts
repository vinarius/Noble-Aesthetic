import Ajv, { Schema } from 'ajv';

const ajv = new Ajv({
  allErrors: true
});

enum jsonType {
  NUMBER = 'number',
  INTEGER = 'integer',
  STRING = 'string',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  NULL = 'null'
}

export interface AdminResetUserPasswordReqBody {
  input: {
    userName: string;
  }
}

export interface ChangePasswordReqBody {
  input: {
    accessToken: string;
    previousPassword: string;
    proposedPassword: string;
  }
}

export interface ConfirmForgotPasswordReqBody {
  input: {
    appClientId: string;
    userName: string;
    proposedPassword: string;
    confirmationCode: string;
  }
}

export interface ConfirmSignUpUserReqBody {
  input: {
    appClientId: string;
    userName: string;
    confirmationCode: string;
    birthdate: string;
  }
}

export interface DynamoUserItem {
  userName: string;
  dataKey: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  birthdate: string;
  firstName: string;
  gender: 'M'|'F'|'';
  lastName: string;
  phoneNumber: string;
}

export interface DynamoUserSessionItem {
  userName: string;
  dataKey: string;
  sessionData: {
    averageSplitTime: string;
    shotsOnTarget: {
      timestamp: string;
      zone: number;
      index: number;
    }[];
    timeStart: string;
    timeEnd: string;
  };
  latest?: number;
}

export interface DynamoUserVaultItem {
  userName: string;
  dataKey: string; //VAULT_{uuid4}
  vault: {
    ammo: {
      brand: string;
      brassMFG: string;
      bulletWeight: string;
      caseLength: string;
      maximumPressure: string;
      name: string;
      notes: string;
      overallLength: string;
      powderType: string;
      powderVolume: string;
      powderWeight: string;
      primerType: string;
      type: string;
    };
    accessories: {
      brand: string;
      modelNumber: string;
      name: string;
      type: string;
    }[];
    brand: string;
    caliber: string;
    name: string;
    s3ImageUrl: string;
    serialNumber: string;
  };
}

export interface DynamoUserSubscriptionItem {
  userName: string;
  isActive: false,
  lastPaid: '',
  nextBilling: '',
  paymentFrequency: 'na',
  dataKey: string;
  datePurchased: string; //TODO: update later with luxon
  latest?: number;
  renewalDate?: string; //TODO: update later with luxon only for premium user
  tier: 'basic'|'premium';
}

export interface putSessionReqBody {
  input: {
    session: {
      userName: string;
      averageSplitTime: string;
      shotsOnTarget: {
        timestamp: string;
        zone: number;
        index: number;
      }[];
      timeStart: string;
      timeEnd: string;
    };
  }
}

export interface ForgotPasswordReqBody {
  input: {
    appClientId: string;
    userName: string;
  }
}

export interface LoginReqBody {
  input: {
    appClientId: string;
    userName: string;
    password: string;
  }
}

export interface LogoutReqBody {
  input: {
    accessToken: string;
  }
}

export interface RefreshTokenReqBody {
  input: {
    appClientId: string;
    refreshToken: string;
  };
}

export interface ResendConfirmationCodeReqBody {
  input: {
    appClientId: string;
    userName: string;
  }
}

export interface SignUpUserReqBody {
  input: {
    appClientId: string;
    userName: string;
    password: string;
  }
}

export interface UpdateUserAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface UpdateUserItem {
  input: {
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
    address?: UpdateUserAddress;
  }
}

export interface VerifyTokenReqBody {
  input: {
    appClientId: string;
    accessToken: string;
  }
}

const adminCreateUserSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'userName',
    'phoneNumber'
  ],
  properties: {
    userName: { type: jsonType.STRING },
    phoneNumber: { type: jsonType.STRING },
    firstName: { type: jsonType.STRING },
    lastName: { type: jsonType.STRING },
    address: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'line1',
        'line2',
        'city',
        'state',
        'zip',
        'country'
      ],
      properties: {
        line1: { type: jsonType.STRING },
        line2: { type: jsonType.STRING, nullable: true },
        city: { type: jsonType.STRING },
        state: { type: jsonType.STRING },
        zip: { type: jsonType.STRING, nullable: true },
        country: { type: jsonType.STRING }
      }
    }
  }
} as const;

const adminResetPasswordSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      required: [
        'userId'
      ],
      properties: {
        userId: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const changePasswordSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'accessToken',
        'previousPassword',
        'proposedPassword'
      ],
      properties: {
        accessToken: {
          type: jsonType.STRING
        },
        previousPassword: {
          type: jsonType.STRING
        },
        proposedPassword: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const confirmForgotPasswordSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'appClientId',
        'userName',
        'proposedPassword',
        'confirmationCode'
      ],
      properties: {
        appClientId: {
          type: jsonType.STRING
        },
        userName: {
          type: jsonType.STRING
        },
        proposedPassword: {
          type: jsonType.STRING
        },
        confirmationCode: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const confirmSignUpUserSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'appClientId',
        'userName',
        'confirmationCode'
      ],
      properties: {
        appClientId: {
          type: jsonType.STRING
        },
        userName: {
          type: jsonType.STRING
        },
        confirmationCode: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const forgotPasswordSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'appClientId',
        'userName'
      ],
      properties: {
        appClientId: {
          type: jsonType.STRING
        },
        userName: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const loginSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'appClientId',
        'userName',
        'password'
      ],
      properties: {
        appClientId: {
          type: jsonType.STRING
        },
        userName: {
          type: jsonType.STRING
        },
        password: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const logoutSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'accessToken'
      ],
      properties: {
        accessToken: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const refreshTokenSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'appClientId',
        'refreshToken'
      ],
      properties: {
        appClientId: {
          type: jsonType.STRING
        },
        refreshToken: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const resendConfirmationCodeSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'appClientId',
        'userName'
      ],
      properties: {
        appClientId: {
          type: jsonType.STRING
        },
        userName: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const signUpUserSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'appClientId',
        'userName',
        'password'
      ],
      properties: {
        appClientId: {
          type: jsonType.STRING
        },
        userName: {
          type: jsonType.STRING
        },
        password: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const updateUserSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [],
      properties: {
        userName: { type: jsonType.STRING },
        phoneNumber: { type: jsonType.STRING },
        firstName: { type: jsonType.STRING },
        lastName: { type: jsonType.STRING },
        address: {
          type: jsonType.OBJECT,
          additionalProperties: false,
          required: [],
          properties: {
            line1: { type: jsonType.STRING },
            line2: { type: jsonType.STRING },
            city: { type: jsonType.STRING },
            state: { type: jsonType.STRING },
            zip: { type: jsonType.STRING },
            country: { type: jsonType.STRING }
          }
        }
      }
    }
  }
} as const;

const verifyTokenSchema: Schema = {
  type: jsonType.OBJECT,
  additionalProperties: false,
  required: [
    'input'
  ],
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'appClientId',
        'accessToken'
      ],
      properties: {
        appClientId: {
          type: jsonType.STRING
        },
        accessToken: {
          type: jsonType.STRING
        }
      }
    }
  }
} as const;

const putSessionSchema: Schema = {
  type: jsonType.OBJECT,
  properties: {
    input: {
      type: jsonType.OBJECT,
      additionalProperties: false,
      required: [
        'session'
      ],
      properties: {
        session: {
          type: jsonType.OBJECT,
          additionalProperties: false,
          required: [
            'averageSplitTime',
            'shotsOnTarget',
            'timeStart',
            'timeEnd',
            'userName'
          ],
          properties: {
            averageSplitTime: {
              type: jsonType.STRING
            },
            timeStart: {
              type: jsonType.STRING
            },
            timeEnd: {
              type: jsonType.STRING
            },
            shotsOnTarget: {
              type: 'array',
              items: {
                type: jsonType.OBJECT,
                additionalProperties: false,
                required: [
                  'timestamp', 'zone', 'index'
                ],
                properties: {
                  timestamp: {
                    type: jsonType.STRING
                  },
                  zone: {
                    type: jsonType.NUMBER,
                    enum: [7, 8, 9, 10]
                  },
                  index: {
                    type: jsonType.NUMBER
                  }
                }
              }
            },
            userName: {
              type: jsonType.STRING
            }
          }
        }
      }
    }
  },
  additionalProperties: false,
  required: [
    'input'
  ]
} as const;

export const validateAdminCreateUser = ajv.compile(adminCreateUserSchema);
export const validateAdminResetPassword = ajv.compile(adminResetPasswordSchema);
export const validateChangePassword = ajv.compile(changePasswordSchema);
export const validateConfirmForgotPassword = ajv.compile(confirmForgotPasswordSchema);
export const validateConfirmSignUpUser = ajv.compile(confirmSignUpUserSchema);
export const validateForgotPassword = ajv.compile(forgotPasswordSchema);
export const validateLogin = ajv.compile(loginSchema);
export const validateLogout = ajv.compile(logoutSchema);
export const validateRefreshToken = ajv.compile(refreshTokenSchema);
export const validateResendConfirmationCode = ajv.compile(resendConfirmationCodeSchema);
export const validateSignUpUser = ajv.compile(signUpUserSchema);
export const validateUpdateUser = ajv.compile(updateUserSchema);
export const validateVerifyToken = ajv.compile(verifyTokenSchema);
export const validatePutSession = ajv.compile(putSessionSchema);
