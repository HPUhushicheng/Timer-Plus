
# 拾光 - 实验室考勤管理软件

<div align="center">
<h3>
  <img src="https://readme-typing-svg.herokuapp.com/?lines= 《拾光》实验室考勤管理软件！;唯有热爱,可抵岁月漫长！&center=true&size=19"><br/>
</h3>

![GitHub stars](https://img.shields.io/github/stars/HPUhushicheng/Timer-Plus?color=fa6470&style=flat)
![GitHub forks](https://img.shields.io/github/forks/HPUhushicheng/Timer-Plus?style=flat)
![License](https://img.shields.io/badge/License-MIT-yellowgreen)
![github ss](https://img.shields.io/badge/拾光-实验室考勤-da282a)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Mac%20%7C%20Web-blueviolet)
</div>

## 项目概述

拾光是一款专为实验室成员设计的跨平台桌面端实验室考勤管理软件，旨在解决实验室日常管理中的痛点问题。通过集成系统管理、时间管理、座位分配、任务管理、文件存储、实时通知、AI 教务聊天、多端协作等功能，帮助实验室成员更高效地协作和管理资源。

## 主要功能

- **成员管理与信息集中化**
  - 统一的成员信息管理系统，实现成员信息的集中管理和实时更新。
  - 支持权限管理，确保信息安全。

- **智能考勤与防作弊机制**
  - 自动化考勤和防作弊功能，通过网络行为分析确保考勤数据的准确性。

- **动态座位分配**
  - 基于最优规划原则，实现实验室座位的动态分配与优化。

- **AI 教务信息查询**
  - 通过自然语言交互，实现教务信息的智能化查询与解析。

- **一站式信息整合与查询**
  - 整合教务、实验室、时长、成员等信息，提供一站式查询服务。

- **智能任务分配与进度可视化**
  - 智能任务分配，支持进度可视化跟踪。

- **跨平台无缝体验**
  - 支持 Windows、Mac 桌面端，Web 端和 Android 移动端，数据实时同步。

## 技术栈

- **前端**: `Vue`, `Vite`, `Element-Plus`, `Vuex`
- **后端**: `Node.js`, `Express`, `WebSocket`, `JWT`, `AES`
- **数据库**: `MySQL`, `Redis`
- **文件存储**: `阿里云 OSS`
- **部署**: `Nginx`, `阿里云轻量应用服务器 (ECS)`
- **跨平台桌面应用**: `Electron`

## 安装与运行

### 前置条件

- 确保已安装 Node.js 和 npm。
- 确保已安装 MySQL 并配置数据库。

### 安装步骤

1. **克隆仓库**

   ```bash
   git clone https://github.com/HPUhushicheng/Timer.git
   ```

2. **安装依赖**

   ```bash
   cd Timer
   pnpm install
   ```

3. **配置数据库**

   - 在 `后端server文件夹` 中配置数据库连接信息,此处并未上传。

4. **启动后端服务**

   ```bash
   node app.js
   ```

5. **启动前端应用**

   - **桌面端**:

     ```bash
     pnpm run dev
     ```


## 使用说明

- **用户注册与登录**
  - 打开软件后，首先进行用户注册，输入学号、姓名等信息。
  - 注册成功后，使用学号和密码登录。

- **考勤管理**
  - 启动软件后，系统自动记录考勤时间。
  - 可查看今日考勤记录和历史考勤数据。

- **座位预约**
  - 在座位管理页面，查看可用座位并进行预约。
  - 系统会根据历史习惯推荐最优座位。

- **AI 教务查询**
  - 在 AI 教务页面，输入教务相关问题，获取智能回复。
  - 支持查询课程表、绩点排名、考试安排等信息。

### 桌面端 (Windows)

1. 下载最新版本的桌面端软件 [下载链接](#)。
2. 双击安装包进行安装。
3. 启动软件并按照提示进行配置。

### Web端

1. 访问 [Web端地址](#)。
2. 使用账号登录并开始使用。

### 移动端 (Android)

1. 下载最新版本的移动端APP [下载链接](#)。
2. 安装并启动APP。
3. 登录并使用各项功能。


## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库。
2. 创建新的分支进行开发。
3. 提交更改并确保通过所有测试。
4. 提交 Pull Request。

## 联系我们

- **项目官网**: [](http://blog.hpuedd.com)
- **邮箱**: timer@linn.fun
- **社交媒体**: [@拾光团队](http://blog.hpuedd.com)




## 参考资料

- [ChaIGLM: A Family of Large Language Models from GLM-130B to GLM-4 All Tools](https://arxiv.org/abs/2406.12793)
- [Task-Oriented Dialogue with In-Context Learning](https://arxiv.org/abs/2402.12234)

---
## 许可证

本项目采用 MIT 许可证，详细内容见 [LICENSE](LICENSE) 文件。

---
《拾光》项目致力于打造一个高效、智能的实验室管理平台，期待您的参与与支持！

