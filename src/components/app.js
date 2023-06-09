import { Router } from 'preact-router';
import { onChange } from "../components/hash";

// Code-splitting is automated for `routes` directory
import Home from '../routes/home';
import SimpleChat from "../routes/chat/simple-chat";
import EndingChat from "../routes/chat/ending-chat";
import TranslateInputChat from "../routes/chat/translate-input-chat";
import RoleplayChat from '../routes/chat/roleplay-chat';
import FancyChat from '../routes/chat/fancy-chat';
import SamanthaChat from '../routes/chat/samantha-chat';
import SelfChat from "../routes/selfchat";
import TwentyQuestions from '../routes/twentyquestions';
import AlgebraTutor from "../routes/algebratutor";
import RolePlayGame from "../routes/roleplaygame";
import SummaryChat from '../routes/chat/summary-chat';
import RecipeParser from "../routes/recipeparser";
import SlideMaker from '../routes/slidemaker';
import Presentation from '../routes/presentation';
import GptKey from '../routes/gptkey';
import { ErrorBoundary } from './errorboundary';

const App = () => {
	return (
		<ErrorBoundary>
			<Router onChange={onChange}>
				<Home path="/" />
				<SimpleChat path="/chat/simple" />
				<EndingChat path="/chat/ending" />
				<TranslateInputChat path="/chat/translate-input" />
				<RoleplayChat path="/chat/roleplay" />
				<SummaryChat path="/chat/summary" />
				<FancyChat path="/chat/fancy" />
				<SamanthaChat path="/chat/samantha" />
				<SelfChat path="/selfchat/" />
				<TwentyQuestions path="/twentyquestions/" />
				<AlgebraTutor path="/algebratutor/" />
				<RolePlayGame path="/roleplaygame/" />
				<RecipeParser path="/recipeparser/" />
				<SlideMaker path="/slidemaker/" />
				<Presentation path="/presentation/" />
				<GptKey path="/gptkey/" />
			</Router>
		</ErrorBoundary>
	);
}

export default App;
