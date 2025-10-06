// test-circular-json-fix.js
// Standalone test for circular JSON handling
console.log("Starting circular JSON test...");

// Simulate the process event with a socket object containing circular references
function testCircularJsonHandling() {
  console.log("Creating test object with circular references...");
  // Create a mock object with circular references (like Socket.io)
  const circularObj = {};
  circularObj.self = circularObj; // Create circular reference
  
  // Create a context with circular references
  const context = {
    sourceContext: {
      client: circularObj,
      data: {
        user: { id: 'test-user', name: 'Test User' }
      }
    }
  };
  
  // Try to stringify it - this would normally throw an error
  try {
    const jsonString = JSON.stringify(context);
    console.log('JSON.stringify succeeded unexpectedly:', jsonString.substring(0, 50) + '...');
  } catch (error) {
    console.log('Expected error with circular references:', error.message);
  }
  
  // Now create a sanitized version
  function sanitizeContext(obj) {
    const seen = new WeakSet();
    
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'function' || typeof value === 'undefined') {
        return undefined;
      }
      
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    }));
  }
  
  try {
    // Try to sanitize
    const sanitized = sanitizeContext(context);
    console.log('Successfully sanitized object:', sanitized);
    
    // Verify the sanitized object doesn't have circular references
    const jsonString = JSON.stringify(sanitized);
    console.log('Sanitized object can be stringified:', jsonString.length > 0);
  } catch (error) {
    console.log('Unexpected error during sanitization:', error.message);
  }
}

// Run the test
testCircularJsonHandling();
