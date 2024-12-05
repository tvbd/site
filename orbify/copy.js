
  // রাইট-ক্লিক নিষ্ক্রিয় করা
        document.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            alert("Sorry! Right-click is disabled.");
        });

        // কীবোর্ড শর্টকাট নিষ্ক্রিয় করা
        document.addEventListener('keydown', function(event) {
            // F12 (ডেভেলপার টুলস)
            if (event.key === 'F12') {
                event.preventDefault();
                alert("F12 is disabled.");
            }

            // Ctrl+Shift+I (Inspect Element)
            if (event.ctrlKey && event.shiftKey && event.key === 'I') {
                event.preventDefault();
                alert("Inspect element is disabled.");
            }

            // Ctrl+Shift+J (Console)
            if (event.ctrlKey && event.shiftKey && event.key === 'J') {
                event.preventDefault();
                alert("Console is disabled.");
            }

            // Ctrl+U (View Source Code)
            if (event.ctrlKey && event.key === 'u') {
                event.preventDefault();
                alert("View source is disabled.");
            }

            // Ctrl+S (Save Page)
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                alert("Save page is disabled.");
            }

            // Ctrl+P (Print)
            if (event.ctrlKey && event.key === 'p') {
                event.preventDefault();
                alert("Print is disabled.");
            }
        });



 // iframe ব্লক করা
        if (window.top !== window.self) {
            // সতর্কবার্তা দেখান এবং পেজ রিডাইরেক্ট করুন
            alert("This website cannot be loaded in an iframe.");
            window.top.location = window.self.location;
        }

// Security Features
document.addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener('keydown', (event) => {
    if (event.key === 'F12' || 
        (event.ctrlKey && event.shiftKey && ['I', 'J', 'C'].includes(event.key)) || 
        (event.ctrlKey && event.key === 'U')) {
        event.preventDefault();
    }
});