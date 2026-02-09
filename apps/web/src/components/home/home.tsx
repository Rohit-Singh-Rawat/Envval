import Header from './header';
import Hero from './hero';
import FeaturesGrid from './features/features-grid';
import ExtensionWorkflowSection from './sections/extension-workflow-section';
import Footer from './footer';

const Home = () => {
	return (
		<>
			<Header />
			<Hero />
			<FeaturesGrid />
			<ExtensionWorkflowSection />
			<Footer />
		</>
	);
};

export default Home;
