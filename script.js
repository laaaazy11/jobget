// ============ 配置 ============
const CONFIG = {
    // ⚠️ 部署前务必替换为你的API Key
    // DeepSeek: https://platform.deepseek.com/
    API_KEY: 'sk-your-deepseek-api-key-here',
    
    // DeepSeek API 端点（兼容OpenAI格式）
    API_URL: 'https://api.deepseek.com/v1/chat/completions',
    
    // 使用的模型
    MODEL: 'deepseek-chat',  // 或 'deepseek-reasoner'(R1推理模型)
};

// ============ 预设数据 ============
// 示例简历（方便评审老师快速体验）
const SAMPLE_RESUME = `教育背景：
- 某某大学 软件工程专业 本科 2023级
- GPA：3.6/4.0
- 主修课程：数据结构、算法设计、数据库原理、操作系统、计算机网络

技能：
- 编程语言：Java（熟练）、Python（熟练）、JavaScript（掌握）、SQL（掌握）
- 框架：Spring Boot、Vue.js、MyBatis
- 工具：Git、Docker、Linux基本操作、Postman
- 数据库：MySQL、Redis

项目经验：
1. 校园二手交易平台（2024.3-2024.6）
   - 基于Spring Boot + Vue.js开发的Web应用
   - 实现了用户认证、商品发布、搜索、即时通讯功能
   - 使用Redis缓存热门商品，响应速度提升40%
   - 独立负责后端API设计与开发

2. 智能课表助手（2024.9-2024.12）
   - Python + Flask开发的小工具
   - 自动从教务系统抓取课程信息，生成可视化课表
   - 支持课程冲突检测和智能提醒

实习经历：
- 暂无正式实习经历

自我评价：
热爱技术，有较强的自学能力和问题解决能力。在GitHub上维护开源项目，获得50+ Star。`;

// 预设岗位JD库
const JOB_DATABASE = {
    '前端开发实习生': `
岗位：前端开发实习生
要求：
- 熟悉HTML5、CSS3、JavaScript（ES6+）
- 了解React或Vue框架
- 了解HTTP协议和浏览器原理
- 有实际项目经验优先
- 良好的沟通能力和团队协作精神
- 计算机相关专业本科及以上
    `.trim(),
    
    'Java后端实习生': `
岗位：Java后端开发实习生
要求：
- 扎实的Java基础，熟悉面向对象编程
- 熟悉Spring Boot、MyBatis等主流框架
- 了解MySQL、Redis等常用数据库
- 了解Linux基本操作
- 了解微服务架构者优先
- 有项目经验者优先
    `.trim(),
    
    '数据分析实习生': `
岗位：数据分析实习生
要求：
- 熟练使用Python（Pandas、NumPy、Matplotlib）
- 掌握SQL进行数据查询和分析
- 了解基本统计学知识
- 有数据可视化经验
- 了解机器学习基础者优先
- 逻辑思维清晰，有较强的数据敏感度
    `.trim(),
    
    'AI产品实习生': `
岗位：AI产品实习生
要求：
- 对AI/大模型技术有浓厚兴趣
- 了解产品设计基本流程
- 有较强的逻辑分析和文档撰写能力
- 了解Axure/Figma等原型工具
- 计算机或相关专业背景优先
- 有产品相关项目或实习经验优先
    `.trim(),
    
    '测试实习生': `
岗位：软件测试实习生
要求：
- 了解软件测试基本理论和方法
- 熟悉至少一种编程语言（Python/Java）
- 了解自动化测试工具（Selenium/JUnit等）
- 细心、有耐心、有较强的逻辑分析能力
- 有测试相关经验者优先
    `.trim()
};

// ============ DOM 元素 ============
const resumeInput = document.getElementById('resumeInput');
const jobSelect = document.getElementById('jobSelect');
const jdInput = document.getElementById('jdInput');
const matchBtn = document.getElementById('matchBtn');
const loadingEl = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const scoreDisplay = document.getElementById('scoreDisplay');
const analysisContent = document.getElementById('analysisContent');
const errorMsg = document.getElementById('errorMsg');
const sampleBtn = document.getElementById('sampleResumeBtn');

// ============ 事件监听 ============
// 填入示例简历
sampleBtn.addEventListener('click', () => {
    resumeInput.value = SAMPLE_RESUME;
    // 动画提示
    sampleBtn.textContent = '✅ 已填入';
    setTimeout(() => { sampleBtn.textContent = '📋 填入示例简历'; }, 1500);
});

// 选择预设岗位时自动填充JD
jobSelect.addEventListener('change', (e) => {
    const jobTitle = e.target.value;
    if (jobTitle && JOB_DATABASE[jobTitle]) {
        jdInput.value = JOB_DATABASE[jobTitle];
    }
});

// 开始匹配
matchBtn.addEventListener('click', startMatching);

// ============ 核心函数：调用AI API ============
async function startMatching() {
    // 1. 验证输入
    const resume = resumeInput.value.trim();
    const jd = jdInput.value.trim();
    
    if (!resume) {
        showError('请先填写简历内容，或点击「填入示例简历」');
        return;
    }
    if (!jd) {
        showError('请选择预设岗位或手动输入岗位JD');
        return;
    }
    
    // 2. 显示加载状态
    hideError();
    resultSection.classList.add('hidden');
    loadingEl.classList.remove('hidden');
    matchBtn.disabled = true;
    matchBtn.textContent = '⏳ 分析中...';
    
    try {
        // 3. 构建Prompt（这是核心！）
        const systemPrompt = `你是一位资深的HR和职业规划专家，拥有15年招聘经验。
你的任务是：
1. 分析候选人的简历与目标岗位JD的匹配度
2. 给出客观、专业、具体的分析

请严格按照以下JSON格式返回分析结果（不要返回其他内容）：
{
  "score": 80,
  "strengths": [
    "具体的优势1",
    "具体的优势2"
  ],
  "gaps": [
    "具体的差距1",
    "具体的差距2"
  ],
  "suggestions": [
    "简历优化建议1",
    "简历优化建议2"
  ],
  "alternativeRoles": [
    "推荐的其他适合岗位1",
    "推荐的其他适合岗位2"
  ],
  "overallAssessment": "总体评价，100字以内"
}

评分标准：0-100分，60分以上表示基本匹配，80分以上表示高度匹配。`;

        const userPrompt = `请分析以下候选人与目标岗位的匹配度：

【候选人简历】
${resume}

【目标岗位JD】
${jd}

请严格按照JSON格式返回分析结果。`;

        // 4. 调用DeepSeek API（兼容OpenAI格式）
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                response_format: { type: 'json_object' }  // 强制JSON输出
            })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || `API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // 5. 解析结果
        const result = JSON.parse(aiResponse);
        
        // 6. 展示结果
        displayResult(result);
        
    } catch (error) {
        console.error('匹配失败:', error);
        showError(`分析失败：${error.message}。请检查网络连接或稍后重试。`);
    } finally {
        loadingEl.classList.add('hidden');
        matchBtn.disabled = false;
        matchBtn.textContent = '🚀 开始智能匹配';
    }
}

// ============ 展示结果 ============
function displayResult(result) {
    resultSection.classList.remove('hidden');
    
    // 分数展示
    scoreDisplay.textContent = `${result.score}%`;
    
    // 根据分数调整颜色
    const scoreCircle = scoreDisplay.parentElement.querySelector('.score-circle');
    if (result.score >= 80) {
        scoreCircle.style.background = 'linear-gradient(135deg, #10B981, #34D399)';
    } else if (result.score >= 60) {
        scoreCircle.style.background = 'linear-gradient(135deg, #F59E0B, #FBBF24)';
    } else {
        scoreCircle.style.background = 'linear-gradient(135deg, #EF4444, #F87171)';
    }
    
    // 构建分析内容HTML
    let html = '';
    
    // 优势
    if (result.strengths && result.strengths.length > 0) {
        html += `<div class="analysis-block" style="border-left-color: #10B981;">
            <h4>✅ 你的优势</h4>
            <ul>${result.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
        </div>`;
    }
    
    // 差距
    if (result.gaps && result.gaps.length > 0) {
        html += `<div class="analysis-block" style="border-left-color: #F59E0B;">
            <h4>⚠️ 需要提升</h4>
            <ul>${result.gaps.map(g => `<li>${g}</li>`).join('')}</ul>
        </div>`;
    }
    
    // 简历优化建议
    if (result.suggestions && result.suggestions.length > 0) {
        html += `<div class="analysis-block" style="border-left-color: #4F46E5;">
            <h4>💡 简历优化建议</h4>
            <ul>${result.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
        </div>`;
    }
    
    // 推荐其他方向
    if (result.alternativeRoles && result.alternativeRoles.length > 0) {
        html += `<div class="analysis-block" style="border-left-color: #8B5CF6;">
            <h4>🎯 你也可以考虑这些方向</h4>
            <ul>${result.alternativeRoles.map(r => `<li>${r}</li>`).join('')}</ul>
        </div>`;
    }
    
    // 总体评价
    if (result.overallAssessment) {
        html += `<div class="analysis-block" style="border-left-color: #EC4899;">
            <h4>📝 总体评价</h4>
            <p>${result.overallAssessment}</p>
        </div>`;
    }
    
    analysisContent.innerHTML = html;
    
    // 滚动到结果区域
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// ============ 辅助函数 ============
function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
}

function hideError() {
    errorMsg.classList.add('hidden');
}