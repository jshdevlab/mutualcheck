// 	X 파일명·내용 검증
const readFileText = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result ?? ""));
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽는 중 오류가 발생했습니다."));
    };

    reader.readAsText(file);
  });
};

export const validateFileName = (
  file: File,
  expectedNames: string[],
  showError: (message: string) => void,
) => {
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".js")) {
    showError("잘못된 파일입니다.");
    return false;
  }

  if (!expectedNames.includes(fileName)) {
    showError("잘못된 파일입니다.");
    return false;
  }

  return true;
};

const extractArchiveRows = (text: string) => {
  const startIndex = text.indexOf("[");
  const endIndex = text.lastIndexOf("]");

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    throw new Error("JSON 배열을 찾을 수 없습니다.");
  }

  const jsonArrayText = text.slice(startIndex, endIndex + 1);
  const parsed: unknown = JSON.parse(jsonArrayText);

  if (!Array.isArray(parsed)) {
    throw new Error("올바른 관계 데이터 형식이 아닙니다.");
  }

  return parsed;
};

export const validateArchiveFileContent = async (
  file: File,
  type: "following" | "followers",
  showError: (message: string) => void,
) => {
  try {
    const text = await readFileText(file);

    if (!text.trim()) {
      showError("비어 있는 파일입니다.");
      return false;
    }

    const expectedKey = type === "following" ? "following" : "follower";

    const wrapperPattern =
      type === "following"
        ? /window\.YTD\.following\.part\d+\s*=/i
        : /window\.YTD\.follower\.part\d+\s*=/i;

    if (!wrapperPattern.test(text)) {
      showError(
        type === "following"
          ? "X 데이터 보관 파일의 following.js가 아닙니다."
          : "X 데이터 보관 파일의 followers.js가 아닙니다.",
      );

      return false;
    }

    const rows = extractArchiveRows(text);

    for (const row of rows) {
      if (typeof row !== "object" || row === null || Array.isArray(row)) {
        showError("관계 파일의 데이터 구조가 올바르지 않습니다.");
        return false;
      }

      const relation = (row as Record<string, unknown>)[expectedKey];

      if (
        typeof relation !== "object" ||
        relation === null ||
        Array.isArray(relation)
      ) {
        showError(
          type === "following"
            ? "following 관계 데이터 구조가 올바르지 않습니다."
            : "follower 관계 데이터 구조가 올바르지 않습니다.",
        );

        return false;
      }

      const accountId = (relation as Record<string, unknown>).accountId;

      if (typeof accountId !== "string" || !/^\d+$/.test(accountId.trim())) {
        showError("관계 파일에 올바른 accountId가 없습니다.");
        return false;
      }

      const userLink = (relation as Record<string, unknown>).userLink;

      if (
        userLink !== undefined &&
        (typeof userLink !== "string" || !userLink.trim())
      ) {
        showError("관계 파일의 userLink 형식이 올바르지 않습니다.");
        return false;
      }
    }

    return true;
  } catch {
    showError("파일 내용을 확인할 수 없습니다.");
    return false;
  }
};
