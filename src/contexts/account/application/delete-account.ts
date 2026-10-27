import { UserRepository } from "../domain/user";

export type DeleteAccount = {
  userId: string;
  /** 지우기 전에 다른 컨텍스트가 이 사람을 가리키는 데이터를 먼저 지운다(외래키) — 실패하면 계정은 남는다 */
  forgetData: (userId: string) => Promise<void>;
};

/**
 * 탈퇴(Command) — 이 사람의 데이터를 먼저 지우고 계정을 지운다. 카카오 회원 번호도 함께 사라진다.
 * 카카오 쪽 「연결된 서비스」는 우리가 끊지 못한다(토큰을 저장하지 않는다) — 화면에서 안내한다.
 */
export async function deleteAccount(command: DeleteAccount, users: UserRepository): Promise<void> {
  await command.forgetData(command.userId);
  await users.delete(command.userId);
}
