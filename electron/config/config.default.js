"use strict";

const path = require("path");

/**
 * 默认配置
 */
module.exports = (appInfo) => {
  const config = {};

  /**
   * 打打开或关闭开发者工具
   */
  config.openDevTools = false;

  /**
   * 显示或关闭应用程序顶部菜单
   */
  config.openAppMenu = false;

  /**
   * 主窗口
   */
  config.windowsOption = {
    title: "拾光",
    width: 850,
    height: 650,
    minWidth: 400,
    minHeight: 300,
    webPreferences: {
      //webSecurity: false,
      contextIsolation: false, // false -> 可在渲染进程中使用electron的api，true->需要bridge.js(contextBridge)
      nodeIntegration: true,
      //preload: path.join(appInfo.baseDir, 'preload', 'bridge.js'),
    },
    frame: true,
    show: false,
    icon: path.join(appInfo.home, "public", "images", "logo-32.png"),
  };

  /**
   * Timer考勤日志
   */
  config.logger = {
    encoding: "utf8",
    level: "INFO",
    outputJSON: false,
    buffer: true,
    enablePerformanceTimer: false,
    rotator: "day",
    appLogName: "ee.log",
    coreLogName: "ee-core.log",
    errorLogName: "ee-error.log",
  };

  /**
   * 远程模式-web地址
   */
  config.remoteUrl = {
    enable: false,
    url: "http://electron-egg.kaka996.com/",
  };

  /**
   * 内置socket服务
   */
  config.socketServer = {
    enable: false,
    port: 7070,
    path: "/socket.io/",
    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8,
    transports: ["polling", "websocket"],
    cors: {
      origin: true,
    },
    channel: "c1",
  };

  /**
   * 内置http服务
   */
  config.httpServer = {
    enable: false,
    https: {
      enable: false,
      key: "/public/ssl/localhost+1.key",
      cert: "/public/ssl/localhost+1.pem",
    },
    host: "127.0.0.1",
    port: 7071,
    cors: {
      origin: "*",
    },
    body: {
      multipart: true,
      formidable: {
        keepExtensions: true,
      },
    },
    filterRequest: {
      uris: ["favicon.ico"],
      returnData: "",
    },
  };

  /**
   * 主进程
   * 将file://修改为http://可解决白屏
   */
  config.mainServer = {
    protocol: "http://",
    indexPath: "public/dist/index.html",
  };

  /**
   * 硬件加速
   */
  config.hardGpu = {
    enable: true,
  };

  /**
   * 异常捕获
   */
  config.exception = {
    mainExit: false,
    childExit: true,
    rendererExit: true,
  };

  /**
   * jobs
   */
  config.jobs = {
    messageLog: true,
  };

  /**
   * 插件功能
   */
  config.addons = {
    window: {
      enable: true,
    },
    tray: {
      enable: true,
      title: "EE程序",
      icon: "/public/images/tray.png",
    },
    security: {
      enable: true,
    },
    awaken: {
      enable: true,
      protocol: "ee",
      args: [],
    },
    autoUpdater: {
      enable: true,
      windows: true,
      macOS: true,
      linux: false,
      options: {
        provider: "generic",
        url: "http://kodo.qiniu.com/",
      },
      force: false,
    },
  };

  return {
    ...config,
  };
};
