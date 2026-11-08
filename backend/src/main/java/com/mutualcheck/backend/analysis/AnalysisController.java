// HTTP 요청받기 / 결과 반환하기
package com.mutualcheck.backend.analysis;

import java.io.IOException;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mutualcheck.backend.analysis.dto.AnalysisResult;

@RestController
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/api/analysis/upload")
    public AnalysisResult uploadAnalysisFiles(
            @RequestParam("followersFile") MultipartFile followersFile,
            @RequestParam("followingFile") MultipartFile followingFile
    ) throws IOException {
        return analysisService.analyze(followersFile, followingFile);
    }
}
