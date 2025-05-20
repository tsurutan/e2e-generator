const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testPlaywrightCodeGenerator() {
  try {
    // First, let's create a test project
    const project = {
      name: "Test Project",
      url: "https://example.com",
      description: "A test project for Playwright code generation"
    };

    // Save the project
    const projectResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (!projectResponse.ok) {
      throw new Error(`Failed to save project: ${projectResponse.statusText}`);
    }

    const savedProject = await projectResponse.json();
    console.log('Saved project:', savedProject);

    // Create a feature
    const feature = {
      name: "Login Feature",
      description: "User authentication functionality",
      projectId: savedProject.id
    };

    // Save the feature
    const featureResponse = await fetch('http://localhost:3000/api/features/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features: [feature], projectId: savedProject.id }),
    });

    if (!featureResponse.ok) {
      throw new Error(`Failed to save feature: ${featureResponse.statusText}`);
    }

    const savedFeatures = await featureResponse.json();
    console.log('Saved features:', savedFeatures);

    // Now create a test scenario
    const scenario = {
      title: "User logs in with valid credentials",
      description: "User enters valid email and password to log in",
      given: "User is on the login page",
      when: "User enters valid email and password and clicks the login button",
      then: "User is redirected to the dashboard",
      featureId: savedFeatures[0].id
    };

    // Save the scenario
    const saveResponse = await fetch('http://localhost:3000/api/scenarios/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scenario }),
    });

    if (!saveResponse.ok) {
      throw new Error(`Failed to save scenario: ${saveResponse.statusText}`);
    }

    const savedScenario = await saveResponse.json();
    console.log('Saved scenario:', savedScenario);

    // Generate Playwright code for the scenario
    const generateCodeResponse = await fetch(`http://localhost:3000/api/scenarios/${savedScenario.id}/generate-code?projectUrl=https://example.com`);

    if (!generateCodeResponse.ok) {
      throw new Error(`Failed to generate code: ${generateCodeResponse.statusText}`);
    }

    const generatedCode = await generateCodeResponse.json();
    console.log('Generated Playwright code:');
    console.log(generatedCode.code);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPlaywrightCodeGenerator();
