// 프론트엔드의 오류 로그 조회 요청을 받아 결과 반환
package com.mutualcheck.backend.admin;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/admin/errors")
public class AdminErrorLogController {

    private final AdminErrorLogRepository adminErrorLogRepository;

    public AdminErrorLogController(
            AdminErrorLogRepository adminErrorLogRepository
    ) {
        this.adminErrorLogRepository =
                adminErrorLogRepository;
    }

    @GetMapping
    public List<ErrorLogResponse> getRecentErrors() {

        return adminErrorLogRepository
                .getRecentErrors()
                .stream()
                .map(error ->
                        new ErrorLogResponse(
                                error.occurredAt(),
                                error.type(),
                                error.message()
                        )
                )
                .toList();
    }

    public record ErrorLogResponse(
            String occurredAt,
            String type,
            String message
    ) {
    }
}