# 简单的 ORM

本节将基于 [`MySQL2`](https://www.npmjs.com/package/mysql2) 实现一个简单的 ORM。（Object Relational Mapping 对象关系映射）。

## 需求分析

我们将实现以下功能：

- 一个类代表一个表
- 字段约束
- 表的增删改查
- 一对一关系
- 一对多关系
- 多对多关系

我们的工作流程将会是：

- 首先定义表实体类。
- 在入口方法中提取用户注册的表实体类，并解析为对应的 `Schema`。
- 通过 `Driver` 链接数据库。
- 转换 `Schema` 为对应的数据库的 `sql` 后执行。
- 使用 `Connection` 执行操作，包括但不限于增删改查。
