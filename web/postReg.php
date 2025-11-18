<?php
header("Content-type: text/html; charset=utf-8");
$username = trim($_POST['username']);
$pw = $_POST['pw'];
$rpw = $_POST['rpw'];
$email = $_POST['email'];
$sex = $_POST['sex'];
$fav = $_POST['fav'];
if($fav){
    $fav = implode("，",$fav);
}
if(!strlen($username)){
    echo "<script>alert('用户名必须填写！');history.back();</script>";
    exit;
}
if(!strlen($pw)){
    echo "<script>alert('密码必须填写！');history.back();</script>";
    exit;
}
if($pw !== $rpw){
    echo "<script>alert('重复密码必须和密码一致！');history.back();</script>";
    exit;
}
$pw = md5($pw);

// 第一步
$conn = mysqli_connect("localhost","root","root","member3");
if(!$conn){
    echo "Error!";
    exit;
}
// 第二步
mysqli_query($conn,"set names utf8");
// 判断用户名是否被占用
$sql = "select * from userinfo where username = '$username'";
$result = mysqli_query($conn,$sql);
// 判断$result这个结果集里是否有记录
if(mysqli_num_rows($result)){
    echo "此用户名已被占用";
    exit;
}
// 第三步
$sql = "insert into userinfo (username, pw, email, sex, fav) values ('$username','$pw','$email','$sex','$fav')";
// 第四步
$result = mysqli_query($conn,$sql);
// 调试
echo $sql . "<br>";
echo mysqli_error($conn);
// 给出反馈
if($result){
    echo "Insert Data Successful!";
}
else{
    echo "Insert Data Error!";
}