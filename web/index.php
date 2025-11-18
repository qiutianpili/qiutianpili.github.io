<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>会员注册Beta</title>
    <style>
        .main{
            /* 设置边框和居中 */
            border: 1px solid #0000FF;
            margin: 0 auto;
            width: 80%;
            max-width:1000px;
            text-align: center;
            padding: 1.5rem 1rem;
            box-shadow: 0 6px 18px rgba(16,24,40,0.06);
            border-radius:8px;
        }

        h1,h2{
            margin: 50px 0;
        }
        h1{
            font-size: 2rem;
            color: #222;
            /* 文字阴影：水平偏移 垂直偏移 模糊半径 颜色 */
            text-shadow: 2px 2px 4px rgba(0,0,0,0.4);
        }
        /* 使 h2 的链接一行显示 */
        .main h2{
            display: flex;
            justify-content: center;
            align-items: flex-start;
            gap: 1.25rem; /* 链接之间的水平间距 */
            flex-wrap: wrap; /* 小屏幕允许换行 */
            padding: 0;
            margin: 40px 0;
            list-style: none;
        }

        .main h2 a{
            display: flex;
            flex-direction: column; /* 中文在上，英文在下 */
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            margin: 0; /* 使用 gap 控制间距，不额外加右边距 */
            color: blue;
            text-decoration: none;
            /* 为导航链接添加更细的文字阴影 */
            text-shadow: 1px 1px 2px rgba(0,0,0,0.25);
        }
        .main h2 a .en{
            display: block;
            font-size: 0.7rem;
            color: #6b7280;
            margin-top: 4px;
        }
        .main h2 a:last-child{
            margin-right: 0;
        }
        .main h2 a:hover{
            color:white;
        }
    </style>
</head>
<body>
<div class="main">
    <h1>会员注册管理系统</h1>
    <h2>
        <a href="index.php">回到首页</a>
        <a href="reg.php">会员注册</a>
        <a href="#">会员登录</a>
        <a href="#">资料修改</a>
        <a href="#">后台管理</a>
    </h2>
</div>
</body>
</html>
