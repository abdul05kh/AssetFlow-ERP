import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { env } from "../../../config/env";
import { authRepository } from "../repository/auth.repository";
import { AuthMapper } from "../mapper/auth.mapper";
import { LoginInput } from "../validator/auth.validator";
import { LoginResponseDto } from "../dto/auth.dto";
import { AuthenticationError, BusinessRuleError } from "../../../utils/errors";
import eventBus from "../../../events/event-bus";
import logger from "../../../utils/logger";

export class AuthService {
  async login(input: LoginInput): Promise<LoginResponseDto> {
    const user = await authRepository.findUserByEmail(input.email);
    
    if (!user) {
      throw new AuthenticationError("Invalid email or password", "AUTH_001");
    }

    // 1. Password check
    const isPasswordValid = await argon2.verify(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password", "AUTH_002");
    }

    // 2. Status check
    if (user.status !== "ACTIVE") {
      throw new BusinessRuleError("Account is inactive or disabled. Contact Administrator", "AUTH_003");
    }

    // 3. Map profile DTO
    const profileDto = AuthMapper.toProfileDto(user);

    // 4. Generate Tokens
    const payload = {
      sub: user.id,
      email: user.email,
      role: profileDto.role.code,
      departmentId: user.departmentId,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign({ sub: user.id }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    // 5. Fire Domain Events & Log
    eventBus.publish("UserLoggedIn", { userId: user.id, email: user.email });
    logger.info(`[Auth] User authenticated successfully: ${user.email}`, { userId: user.id });

    return {
      accessToken,
      refreshToken,
      user: profileDto,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      return decoded;
    } catch (err) {
      throw new AuthenticationError("Session expired or invalid token", "AUTH_001");
    }
  }
}

export const authService = new AuthService();
export default authService;
