// 관리자 API 요청·응답
package com.mutualcheck.backend.admin;

import java.time.YearMonth;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mutualcheck.backend.admin.dto.AdminSummaryResponse;
import com.mutualcheck.backend.admin.dto.AdminTrendResponse;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/admin")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    public AdminStatsController(AdminStatsService adminStatsService) {
        this.adminStatsService = adminStatsService;
    }

    @GetMapping("/summary")
    public AdminSummaryResponse getSummary() {
        return adminStatsService.getSummary();
    }

    @GetMapping("/monthly")
    public AdminTrendResponse getMonthly(
            @RequestParam
            @DateTimeFormat(pattern = "yyyy-MM")
            YearMonth month
    ) {
        return adminStatsService.getMonthly(month);
    }

    @GetMapping("/yearly")
    public AdminTrendResponse getYearly(@RequestParam int year) {
        return adminStatsService.getYearly(year);
    }
}
