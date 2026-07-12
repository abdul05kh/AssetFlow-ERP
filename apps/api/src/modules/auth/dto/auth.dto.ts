export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface UserProfileDto {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  designation?: string | null;
  status: string;
  role: {
    id: string;
    name: string;
    code: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserProfileDto;
  expiresIn: string;
}
