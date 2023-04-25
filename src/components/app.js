import { Router } from 'preact-router';
import { onChange } from "../components/hash";

// Code-splitting is automated for `routes` directory
import Home from '../routes/home';
import Chat from "../routes/chat";
import Chat2 from "../routes/chat/chat2";
import Chat3 from "../routes/chat/chat3";
import SelfChat from "../routes/selfchat";
import TwentyQuestions from '../routes/twentyquestions';
import AlgebraTutor from "../routes/algebratutor";
import RolePlayGame from "../routes/roleplaygame";
import RecipeParser from "../routes/recipeparser";
import SlideMaker from '../routes/slidemaker';
import Presentation from '../routes/presentation';
import GptKey from '../routes/gptkey';

const App = () => {
	return (
		<Router onChange={onChange}>
			<Home path="/" />
			<Chat path="/chat/" />
			<Chat2 path="/chat2/" />
			<Chat3 path="/chat3/" />
			<SelfChat path="/selfchat/" />
			<TwentyQuestions path="/twentyquestions/" />
			<AlgebraTutor path="/algebratutor/" />
			<RolePlayGame path="/roleplaygame/" />
			<RecipeParser path="/recipeparser/" />
			<SlideMaker path="/slidemaker/" />
			<Presentation path="/presentation/" />
			<GptKey path="/gptkey/" />
		</Router>
	);
}

export default App;
