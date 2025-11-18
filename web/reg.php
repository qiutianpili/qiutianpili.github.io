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
        .red{
            color: red;
        }
    </style>
</head>
<body>
<div class="main">
    <h1>会员注册管理系统</h1>
    <h2>
        <a href="index.php">回到首页<small class="en">Home</small></a>
        <a href="reg.php">会员注册<small class="en">Register</small></a>
        <a href="#">会员登录<small class="en">Login</small></a>
        <a href="#">资料修改<small class="en">Edit Profile</small></a>
        <a href="#">后台管理<small class="en">Admin</small></a>
    </h2>
</div>
<form action="postReg.php" method="post" onsubmit="return check()">
        <table border="1" align="center" style="width: 90%;border-collapse: collapse;max-width: 500px;" cellpadding="10">
            <tr>
                <td align="right">用户名</td>
                <td align="left">
                    <label>
                        <input style="padding: 5px" name="username" placeholder="请输入用户名"><spawn class="red">*</spawn>
                    </label>
                </td>
            </tr>
            <tr>
                <td align="right">密码</td>
                <td align="left">
                    <label>
                        <input style="padding: 5px" type="password" name="pw" placeholder="请用数字和字母构成"><spawn class="red">*</spawn>
                    </label>
                </td>
            </tr>
            <tr>
                <td align="right">再次输入密码</td>
                <td align="left">
                    <label>
                        <input style="padding: 5px" type="password" name="rpw" placeholder="再次确认您的密码"><spawn class="red">*</spawn>
                    </label>
                </td>
            </tr>
            <tr>
                <td align="right">邮箱</td>
                <td align="left">
                    <label>
                        <input style="padding: 5px" name="email">
                    </label>
                </td>
            </tr>
            <tr>
                <td align="right">性别</td>
                <td align="left">
                    <label>
                        <input style="padding: 5px" type="radio" name="sex" value="男">男
                    </label>
                    <label>
                        <input style="padding: 5px" type="radio" name="sex" value="女">女
                    </label>
                </td>
            </tr>
            <tr>
                <td align="right">爱好</td>
                <td align="left">
                    <label>
                        <input style="padding: 5px" type="checkbox" name="fav[]" value="听音乐">听音乐
                    </label>
                    <label>
                        <input style="padding: 5px" type="checkbox" name="fav[]" value="打游戏">打游戏
                    </label>
                    <label>
                        <input style="padding: 5px" type="checkbox" name="fav[]" value="跑步">跑步
                    </label>
                </td>
            </tr>
            <tr>
                <td align="right">
                    <input style="padding: 5px" type="submit">
                </td>
                <td align="left">
                    <input style="padding: 5px" type="reset">
                </td>
            </tr>
        </table>
</form>
<script>
    function check(){
        let username = document.getElementsByName('username')[0].value.trim();
        let usernameReg = /^[a-zA-Z0-9]{3,10}$/;
        if(!usernameReg.test(username)){
            alert("用户名只能是由大小写字母、数字构成，且长度为3-10");
            return false;
        }
        let pw = document.getElementsByName('pw')[0].value.trim();
        let pwReg = /^[a-zA-Z0-9_\-*]{6,10}$/;
        if(!pwReg.test(pw)){
            alert("密码只能是由大小写字母、数字、下划线、-和*构成，且长度为6-10");
            return false;
        }


        let email = document.getElementsByName('email')[0].value.trim();
        let emailReg = /^[a-zA-Z0-9_\-]+@([a-zA-Z0-9]+\.)+(com|cn|net|org)$/;
        if(email){
            if(!emailReg.test(email)){
            alert("邮箱格式不对！");
            return false;
            }
        }
        
</script>
</body>
</html>

