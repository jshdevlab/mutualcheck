// Spring Boot 분석 API 호출
import type { AnalysisResult } from "../App";

export async function uploadAnalysisFiles(
  followersFile: File,
  followingFile: File,
): Promise<AnalysisResult> {
  const formData = new FormData();

  formData.append("followersFile", followersFile);
  formData.append("followingFile", followingFile);

  const response = await fetch("/api/analysis/upload", {
    method: "POST",
    body: formData,
  });

  const data: AnalysisResult = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "파일 업로드에 실패했습니다.");
  }

  return data;
}
