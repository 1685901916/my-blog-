// 主题的全局样式（颜色变量、正文排版）原本是靠 ImageWrapper 里的 import.meta.glob("../../**") 顺带引进页面的；
// 原型页不一定用 ImageWrapper，所以在这里显式引入，页面 import 这个文件即可
import "../../styles/variables.styl";
import "../../styles/main.css";
import "../../styles/markdown.css";
import "../../styles/markdown-extend.styl";
