// debug.js
console.log("Debug script loaded");

// Add a window error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global error:", message, "at", source, ":", lineno, ":", colno);
  console.error("Error object:", error);
  
  // Create a visible error message in the DOM
  const errorDiv = document.createElement('div');
  errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '20px';
  errorDiv.style.margin = '20px';
  errorDiv.style.borderRadius = '5px';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.zIndex = '9999';
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.right = '0';
  
  errorDiv.innerHTML = `<h2>Error Detected</h2>
                       <p><strong>Message:</strong> ${message}</p>
                       <p><strong>Source:</strong> ${source}</p>
                       <p><strong>Line:Col:</strong> ${lineno}:${colno}</p>
                       <p><strong>Stack:</strong> ${error?.stack?.replace(/\n/g, '<br>') || 'No stack available'}</p>`;
  
  document.body.appendChild(errorDiv);
  
  return false; // Let the default error handler run as well
};

// Also capture unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Create a visible error message in the DOM
  const errorDiv = document.createElement('div');
  errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '20px';
  errorDiv.style.margin = '20px';
  errorDiv.style.borderRadius = '5px';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.style.zIndex = '9999';
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.right = '0';
  
  errorDiv.innerHTML = `<h2>Unhandled Promise Rejection</h2>
                       <p><strong>Reason:</strong> ${event.reason}</p>
                       <p><strong>Stack:</strong> ${event.reason?.stack?.replace(/\n/g, '<br>') || 'No stack available'}</p>`;
  
  document.body.appendChild(errorDiv);
});

// Check if root element exists and monitor DOM changes
setTimeout(() => {
  const rootElement = document.getElementById('root');
  console.log("Root element exists:", !!rootElement);
  
  if (!rootElement) {
    console.error("Root element not found!");
    // Create root element if missing
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    console.log("Created missing root element");
  } else {
    console.log("Root element:", rootElement);
    
    // If root exists but is empty, show a message
    if (!rootElement.children.length) {
      console.warn("Root element exists but has no children");
      
      // Create a visible message
      const debugDiv = document.createElement('div');
      debugDiv.style.backgroundColor = 'rgba(0, 0, 255, 0.8)';
      debugDiv.style.color = 'white';
      debugDiv.style.padding = '20px';
      debugDiv.style.margin = '20px';
      debugDiv.style.borderRadius = '5px';
      debugDiv.style.fontFamily = 'monospace';
      
      debugDiv.innerHTML = '<h2>Debug Info</h2><p>Root element exists but React has not rendered anything</p>';
      
      rootElement.appendChild(debugDiv);
    }
  }
  
  // Check for any JS module loading errors
  const moduleLoadErrors = [];
  window.addEventListener('error', function(event) {
    if (event.filename && event.filename.includes('.js')) {
      moduleLoadErrors.push({
        filename: event.filename,
        message: event.message,
        lineno: event.lineno,
        colno: event.colno
      });
      console.error('Module load error:', event);
    }
  }, true);  // Capture in the capture phase
  
}, 1000);

// Monitor all script errors
const originalCreateElement = document.createElement;
document.createElement = function(...args) {
  const element = originalCreateElement.apply(document, args);
  if (args[0].toLowerCase() === 'script') {
    element.addEventListener('error', function(e) {
      console.error('Script loading error:', e);
      console.error('Failed script:', element.src);
    });
  }
  return element;
};
