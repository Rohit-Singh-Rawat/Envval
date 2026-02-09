import Header from './header';
import Hero from './hero';
import FeaturesGrid from './features/features-grid';
import ExtensionWorkflowSection from './sections/extension-workflow-section';
import FAQSection from './sections/faq-section';
import Footer from './footer';

const Home = () => {
	return (
		<>
			<Header />
			<Hero />
			<FeaturesGrid />
			<ExtensionWorkflowSection />
			<FAQSection />
			<Footer />
		</>
	);
};

export default Home;
