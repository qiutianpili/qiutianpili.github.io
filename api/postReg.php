<?php
$username = $_POST['username'];
$pw = $_POST['pw'];
$rpw = $_POST['rpw'];
$email = $_POST['email'];
$sex = $_POST['sex'];
$fav = $_POST['fav'];
echo "您输入的用户名是: " . $username . "<br>";
echo "您输入的密码是: " . $pw . "<br>";
echo "您输入的重复密码是: " . $rpw . "<br>";
echo "您输入的邮箱是：$email <br>";
echo "您输入的性别是: " . $sex . "<br>";
$fav = implode("，",$fav);
echo "您输入的爱好是: " . $fav . "<br>";
?>