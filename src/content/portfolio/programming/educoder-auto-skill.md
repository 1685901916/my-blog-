---
title: 自动化头歌任务 Skill
published: 2026-05-22
description: 用 Codex 配合浏览器自动化、VNC 截图和终端检查脚本，自动化处理头歌 EduCoder 网页与远程虚拟机任务的流程记录
image: ""
tags: ["程序系", "Codex", "自动化", "EduCoder", "Skill", "VNC"]
category: 作品
draft: false
showOnHomepage: true
sourceLink: "https://github.com/1685901916/educoder-auto-skill"
---

# 自动化头歌任务 Skill

GitHub 地址：[1685901916/educoder-auto-skill](https://github.com/1685901916/educoder-auto-skill)

这个 Skill 耗的 token 比较多，用之前要注意一下。

这里记录一下用 Codex 自动化处理头歌 EduCoder 任务的基本流程。

头歌任务一般运行在网页和远程虚拟机里。页面上有任务说明、VNC 桌面、代码编辑器和评测按钮。手动做当然可以，但步骤多，容易漏看任务图片、点错位置，或者没搞清楚检查脚本到底检查什么。

所以我的思路是：让 Codex 配合浏览器自动化、VNC 截图和终端命令，完成大部分重复操作。

## 一、自动化用到什么

主要用到四类能力。

### 1. 浏览器自动化

浏览器自动化用来操作头歌网页。

可以完成：

- 打开任务页面
- 读取任务说明
- 查看任务图片
- 点击“开始学习”“继续挑战”“评测”等按钮
- 切换上一关、下一关
- 读取评测结果

这部分适合处理普通网页元素，比如按钮、链接、任务文本。

### 2. VNC 截图和坐标操作

头歌里的虚拟机桌面通常不是普通网页元素，而是一个远程桌面画面。

也就是说，虚拟机里的终端、图标、文件管理器，不能直接用网页选择器控制。

所以需要通过：

- 截图
- 坐标点击
- 键盘输入
- 观察终端输出

来操作虚拟机。

这一步要特别注意焦点。输入命令前，要确认光标确实在终端里。

### 3. 终端命令

进入虚拟机后，用终端命令查看文件、修改文件、运行检查脚本。

常用命令包括：

```sh
find /data/workspace -maxdepth 6 -type f 2>/dev/null | grep -Ei 'check|main|run|test|step'
```

这个命令用来查找可能的检查脚本。

查看脚本内容：

```sh
sed -n '1,220p' /data/workspace/myshixun/src/check.sh
```

搜索脚本里检查的文件路径：

```sh
grep -R "FILEPATH\|file_path\|-f \|result.txt\|aggregate.csv\|jmeter.log" /data/workspace/myshixun/src /data/workspace/myshixun 2>/dev/null | head -120
```

### 4. 本地检查脚本

修改完成后，不要马上点击网页上的“评测”。

应该先在虚拟机终端里运行检查脚本：

```sh
bash /data/workspace/myshixun/src/check.sh
```

本地检查通过后，再点击网页评测。

这样可以减少无效提交，也更容易定位问题。

## 二、自动化处理流程

整体流程可以这样理解：

```text
Codex 打开头歌页面
↓
浏览器自动化读取任务说明
↓
查看任务图片和 VNC 桌面
↓
进入虚拟机终端
↓
查找 check / test / main 脚本
↓
分析检查脚本到底检查什么
↓
修改对应文件或环境
↓
运行本地检查脚本
↓
本地通过后点击网页评测
↓
读取评测结果
```

这个流程的重点不是让 Codex 直接猜答案，而是让它先收集信息，再根据检查脚本判断真正的通过条件。

## 三、为什么要看检查脚本

头歌页面上的提示不一定是真正要写入的内容。

比如页面可能显示：

```text
恭喜你，通关成功！
```

但检查脚本真正检查的可能是某个文件内容是不是：

```text
OK
```

如果只看页面提示，很容易把错误内容写进文件。

所以核心原则是：

> 页面告诉你任务是什么，检查脚本告诉你怎样才算通过。

## 四、常见情况

### 1. 权限问题

有些任务不是代码错，而是文件没有执行权限。

比如出现：

```text
Permission denied
```

这时可能需要修改权限：

```sh
chmod 777 文件名
```

不要一看到报错就急着改代码。先判断是不是环境权限问题。

### 2. 文件路径问题

有些任务会检查固定路径下的文件。

比如：

```text
/data/workspace/myshixun/Jmeter/result/result.txt
```

这时文件必须放在正确路径，文件名也不能写错。

如果目录不存在，需要先创建目录：

```sh
mkdir -p /data/workspace/myshixun/Jmeter/result
```

### 3. 多关卡任务

多关卡任务不要自己猜 URL。

应该使用页面里的：

- 继续挑战
- 上一关
- 下一关

这样不容易跳错关卡，也不容易漏做某一关。

### 4. Monaco 编辑器问题

有些任务是在网页代码编辑器里写代码。

普通复制粘贴可能导致：

- 缩进错误
- 内容没有真正写入编辑器
- 页面显示和真实代码不一致

如果运行时报：

```text
IndentationError
```

就要重点检查缩进和真实代码内容。

### 5. JMeter 或 Postman 任务

这类任务不要只看工具界面。

很多时候检查脚本会检查：

- result.txt
- aggregate.csv
- jmeter.log
- result.json

所以要先看脚本，确认它到底检查哪个文件、哪个字段、哪个结果。

## 五、自动化时要注意什么

### 1. VNC 不是普通网页

虚拟机里的内容是远程桌面画面，不是普通 DOM 元素。

所以不能直接用网页选择器点里面的终端或图标。

要通过截图、坐标点击和键盘输入来操作。

### 2. 输入命令前确认焦点

如果终端没有焦点，命令可能会输入到别的地方。

所以自动化操作时，输入命令前要先确认终端可用。

### 3. 不要频繁点击评测

更稳的方式是：

```text
先本地运行检查脚本
通过后再点击网页评测
```

这样比反复点“评测”更稳定。

### 4. 不要只读页面预期输出

页面预期输出不一定等于文件内容。

最终以检查脚本为准。

## 六、常用命令整理

查找检查脚本：

```sh
find /data/workspace -maxdepth 6 -type f 2>/dev/null | grep -Ei 'check|main|run|test|step'
```

查看检查脚本：

```sh
sed -n '1,220p' /data/workspace/myshixun/src/check.sh
```

搜索检查路径：

```sh
grep -R "FILEPATH\|file_path\|-f \|result.txt\|aggregate.csv\|jmeter.log" /data/workspace/myshixun/src /data/workspace/myshixun 2>/dev/null | head -120
```

运行本地检查：

```sh
bash /data/workspace/myshixun/src/check.sh
```

查看文件权限：

```sh
ls -l 文件名
```

修改执行权限：

```sh
chmod 777 文件名
```

创建目录：

```sh
mkdir -p 目录路径
```

## 七、总结

用 Codex 自动化处理头歌任务，重点不是直接猜答案，而是把重复流程自动化：

- 读取页面
- 查看图片
- 操作 VNC
- 查找检查脚本
- 分析通过条件
- 修改文件或环境
- 本地运行检查
- 最后点击评测

最稳定的做法是：

> 先自动化收集信息，再根据检查脚本操作，最后本地验证通过后再提交。

这样可以减少反复提交失败，也能更快定位问题。
