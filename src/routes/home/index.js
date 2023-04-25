import { Page, FreeChunk } from "../../components/page";
import { A } from "../../components/input";

const Home = () => {
	return (
		<Page title="FUN WITH GPT!">
			<div>
				<ul>
					<li>Chat:
						<ol class="pl-4">
							<li><A href="/chat/simple">Simple chat</A></li>
							<li><A href="/chat/ending">Chat with ending</A></li>
							<li><A href="/chat/translate-input">Chat that translates input</A></li>
							<li><A href="/chat/angry">Angry chat</A></li>
							<li><A href="/chat/fancy">Fancy chat</A></li>
							<li><A href="/chat/samantha">Samantha chat</A></li>
							<li><A href="/selfchat">Self-Chat: GPT vs GPT</A></li>
						</ol>
					</li>
					<li>Games:
						<ol class="pl-4">
							<li><A href="/twentyquestions">Twenty Questions</A></li>
							<li><A href="/roleplaygame">Role Playing Game</A></li>
						</ol>
					</li>
					<li><A href="/algebratutor">Algebra Tutor</A></li>
					<li><A href="/recipeparser">Recipe Parser</A></li>
					<li><A href="/slidemaker">Slide Maker</A></li>
					<li><A href="/presentation">Slides for a presentation about this</A></li>
					<li><A href="/gptkey">Manage your GPT key</A></li>
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
