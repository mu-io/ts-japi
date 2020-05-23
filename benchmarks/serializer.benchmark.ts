import Benchmark from "benchmark";
import { Linker, Serializer, Relator, Metaizer, Paginator } from "../src";
import { User, Article, Comment } from "../test/models";
import { getJSON } from "../test/utils/get-json";

const suite = new Benchmark.Suite();

for (let i = 0; i < 5; i++) {
 User.save(new User(String(i)));
}
for (let i = 0; i < 5; i++) {
 Article.save(new Article(String(i), User.storage[0]));
}
for (let i = 0; i < 10; i++) {
 Comment.save(new Comment(String(i), User.storage[0], Article.storage[0]));
}
let UserSerializer = new Serializer<User>("users", {
 depth: 0, // Change to 2 to see the difference
});
let CommentSerializer = new Serializer<Comment>("comments");
let ArticleSerializer = new Serializer<Article>("articles");
const UserArticleRelator = new Relator<User, Article>(async (user: User) => user.getArticles(), {
 serializer: ArticleSerializer,
});
const ArticleCommentRelator = new Relator<Article, Comment>(
 async (article: Article) => article.getComments(),
 {
  serializer: CommentSerializer,
 }
);
const CommentUserRelator = new Relator<Comment, User>(
 async (comment: Comment) => comment.getAuthor(),
 {
  serializer: UserSerializer,
 }
);
CommentSerializer.options.relators = CommentUserRelator;
UserSerializer.options.relators = UserArticleRelator;
ArticleSerializer.options.relators = ArticleCommentRelator;

// add tests
suite
 .add("Serializer#Test", async function () {
  const user = User.storage[0];
  await UserSerializer.serialize(user);
 })
 // add listeners
 .on("cycle", function (event: any) {
  console.log(String(event.target));
 })
 .on("complete", function (this: any) {
  console.log("Fastest is " + this.filter("fastest").map("name"));
 })
 // run async
 .run({ async: true });
