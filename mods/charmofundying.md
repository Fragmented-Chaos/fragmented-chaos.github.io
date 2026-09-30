---
layout: page
lang: zh
key: charmofundying
title: Charm of Undying：Reborn
permalink: /mods/charmofundying/
---

<div class="mod-hero">
  <img class="mod-icon" src="{{ '/assets/images/charmofundying/icon.png' | relative_url }}" alt="Charm of Undying: Reborn 图标" width="96" height="96">
  <div>
    <p class="mod-tagline">把不死图腾放进饰品栏的护符槽，死亡时自动触发复活 —— 不用手持，放在饰品栏里就行。</p>
    <p class="mod-badges">
      <span class="badge">Minecraft 26.3</span>
      <span class="badge">Fabric · NeoForge</span>
      <span class="badge">需要饰品模组</span>
    </p>
  </div>
  <p class="mod-actions">
    <a class="btn btn-primary" href="https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/releases" target="_blank" rel="noopener">下载</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn" target="_blank" rel="noopener">源码</a>
    <a class="btn" href="https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/issues" target="_blank" rel="noopener">反馈问题</a>
  </p>
</div>

## 安装

这个模组**依赖饰品槽模组**，得先装好其中一个：

| 平台 | 前置 |
|------|------|
| Fabric | [Fabric API](https://modrinth.com/mod/fabric-api) + [Trinkets Updated](https://modrinth.com/mod/trinkets) |
| NeoForge | [Curios API](https://modrinth.com/mod/curios) **或** [Trinkets Updated](https://modrinth.com/mod/trinkets)（任选其一） |

1. 装好上面对应的前置
2. 下载 `charmofundyingreborn-<版本>-universal.jar`（Fabric 与 NeoForge 通用），丢进 `.minecraft/mods/`
3. 启动游戏

## 使用

1. 打开饰品界面（Trinkets / Curios 的快捷键）
2. 把**不死图腾**放进 **护符（Charm）** 槽
3. 死亡时自动消耗图腾并复活

图腾**不用拿在手上**，放在饰品栏里就会生效。

## 兼容性

- 按 `c:totems` 标签识别图腾：**任何打了这个标签的物品**都能当图腾用，别的模组加的物品同样生效
- 当前版本 `1.1.0-alpha.2+26.3`，对应 Minecraft 26.3

## 给模组作者

想让自己的物品也能触发，或者把其它饰品系统接进来，见仓库里的接入文档：

- [Integration guide（English）](https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/blob/main/docs/INTEGRATION.md)
- [集成文档（中文）](https://github.com/Fragmented-Chaos/Charm-of-Undying-Reborn/blob/main/docs/INTEGRATION.zh_CN.md)

许可证 **MIT**。
