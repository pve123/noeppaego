/**
 * account 컨텍스트의 공개 API — 카카오 로그인·탈퇴. 다른 컨텍스트와 화면(app/)은 이 파일만 import 한다.
 */
import "server-only";
import { deleteAccount as remove, type DeleteAccount } from "./application/delete-account";
import { signInWithKakao as handle, type SignInWithKakao } from "./application/sign-in-with-kakao";
import { DrizzleUserRepository } from "./infrastructure/drizzle-user-repository";
import { KakaoOAuth } from "./infrastructure/kakao-oauth";

const kakao = new KakaoOAuth();
const users = new DrizzleUserRepository();

export const signInWithKakao = (command: SignInWithKakao) => handle(command, kakao, users);
export const deleteAccount = (command: DeleteAccount) => remove(command, users);
export { kakaoAuthorizeUrl } from "./infrastructure/kakao-oauth";
