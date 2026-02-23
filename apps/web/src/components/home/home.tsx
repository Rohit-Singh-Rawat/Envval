import FeaturesGrid from "./features/features-grid";
import Footer from "./footer";
import Header from "./header";
import Hero from "./hero";
import ExtensionWorkflowSection from "./sections/extension-workflow-section";
import FAQSection from "./sections/faq-section";

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
