import { Page, FreeChunk } from "../../components/page";
import { A } from "../../components/input";

const Home = () => {
	return (
		<Page title="FUN WITH GPT!">
			<div>
				<ul>
					<li>
						<A href="/chat">Chat</A>
						{" | "} <A href="/chat2">Chat 2</A>
						{" | "} <A href="/chat3">Chat 3</A>
					</li>
					<li><A href="/selfchat">Self-Chat</A></li>
					<li><A href="/twentyquestions">Twenty Questions</A></li>
					<li><A href="/algebratutor">Algebra Tutor</A></li>
					<li><A href="/roleplaygame">Role Play Game</A></li>
					<li><A href="/recipeparser">Recipe Parser</A></li>
					<li><A href="/slidemaker">Slide Maker</A></li>
					<li><A href="/presentation">Presentation</A></li>
				</ul>
			</div>
			<FreeChunk>
				<div class="w-2/3 p-4 overflow-auto m-2">
					<h2 class="font-bold text-lg">Party like it's AI O'clock</h2>
					<img
						class="mx-auto my-auto rounded-md shadow-xl"
						src="/assets/robots-partying.jpg" />
				</div>
			</FreeChunk>
		</Page >
	);
};

export default Home;
