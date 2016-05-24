// Computer Playground UI Testing

var name = "Tester",
    tester = 3,
    url = "http://localhost:8080";


casper.test.begin('Home page', 4, function suite(test) {
    casper.start(url, function() {
        test.assertTitle("CYPHERPUNK Computer-Spielplatz", "CPG title.");

        test.assertExists(".nav-tabs .btn-0", "Button Programmieren");
        test.assertExists(".login-area a[href='/login/']", "Login Button");
        test.assertExists(".login-area a[href='/signup/']", "Signup Button");
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Signup', 15, function suite(test) {

    var i = 0;

    (function signup() {

        casper.start(url, function() {
            test.assertExists(".login-area a[href='/signup/']", "Signup Button for " + name + i );
        });

        /////////////////////////////////////////////////////////////////77
        // Signup 1: Checking header
        casper.thenClick( ".login-area a[href='/signup/']", function() {

            test.assertExists(".form-signin-heading", "Header exists");
            test.assertEvalEquals(function() {
                return __utils__.findOne("form button").textContent;
            }, "Konto anlegen", "Header content");

            casper.fill('form', { name: "Admin" }, false);
            casper.fill('form', { password: name + i }, false);
            casper.fill('form', { password2: name + i }, false);
        } );

        /////////////////////////////////////////////////////////////////77
        // Signup 2: Signup with existing accout
        casper.thenClick( "form button", function() {

            test.assertExists( "form.has-error", "Signup with name 'Admin' throws no error." );

            casper.fill('form', { name: name + i }, false);
            casper.fill('form', { password: name }, false);
            casper.fill('form', { password2: name + i }, false);
        } );

        /////////////////////////////////////////////////////////////////77
        // Signup 3: Signup with unmatching passwords
        casper.thenClick( "form button", function() {

            test.assertExists( "form.has-error", "Signup with not matching passwords." );

            casper.fill('form', { name: name + i }, false);
            casper.fill('form', { password: name + i }, false);
            casper.fill('form', { password2: name + i }, false);
        } );

        /////////////////////////////////////////////////////////////////77
        // Signup 3: Signup ok
        casper.thenClick( "form button", function() {

            if( casper.exists( "form.has-error" ) ) {

                test.assert(false, "Test user is already defined? (Delete all '"+name+"*' accounts and start again.)")
                test.done();
            }

            casper.thenClick( ".login-area a[href='/logout']", function() {
                if( ++i < tester ) signup();
            } );
        } );
    })();

    casper.run(function() {
        test.done();
    });
});

/////////////////////////////////////////////////////////////////77///////////////////////////////////////
// Login Test
//
casper.test.begin('Login', 15, function suite(test) {

    var i = 0;

    (function login() {

        casper.start(url, function() {
            test.assertExists(".login-area a[href='/login/']", "Login Button for " + name + i );
        });

        /////////////////////////////////////////////////////////////////77
        // Login 1: Checking header
        casper.thenClick( ".login-area a[href='/login/']", function() {

            test.assertExists(".form-login-heading", "Header exists");
            test.assertEvalEquals(function() {
                return __utils__.findOne("form button").textContent;
            }, "Einloggen", "Button label");

            casper.fill('form', { name: name + i }, false);
            casper.fill('form', { password: name }, false);

        });

        /////////////////////////////////////////////////////////////////77
        // Login 2: Login with wrong password
        casper.thenClick( "form button", function() {

            test.assertExists( "form.has-error", "Login with wrong password." );

            casper.fill('form', { name: name + i }, false);
            casper.fill('form', { password: name + i }, false);
        });

        /////////////////////////////////////////////////////////////////77
        // Login 3: Login ok
        casper.thenClick( "form button", function() {

            test.assertExists( ".login-area a[href='/logout']", "Logout button." );
            casper.thenClick( ".login-area a[href='/logout']", function() {
                if( ++i < tester ) login();
            } );
        } );
    })();

    casper.run(function() {
        test.done();
    });
});

/////////////////////////////////////////////////////////////////77///////////////////////////////////////
// Live-Editor Test
//
casper.test.begin('Live-Editor', 16, function suite(test) {

    var i = 0;

    casper.start(url, function() {
        test.assertExists(".login-area a[href='/login/']", "Login Button " + " for " + name + i );
    });

    /////////////////////////////////////////////////////////////////77
    // User 0 Login
    casper.thenClick( ".login-area a[href='/login/']", function() {

        casper.fill('form', { name: name + "0" }, false);
        casper.fill('form', { password: name + "0" }, false);
    });

    /////////////////////////////////////////////////////////////////77
    // Go to Live-Editor
    casper.thenClick( "form button", function() {

        test.assertExists( "ul.kuenste a[href='live-editor']", "Button to Live-Editor" );
    });


    /////////////////////////////////////////////////////////////////77
    // Login 3: Login ok
    casper.thenClick( "ul.kuenste a.btn-0", function() {

        test.assertExists( ".scratchpad-ace-editor .ace_text-input", "Text input for Ace-Editor (JavaScript)." );
        casper.fill(".scratchpad-ace-editor", { "text-input": "ellipse( 100, 100, 100, 101 );\n\n" }, false);

        test.assertExists( "#project-bar-save", "Save button of project bar" );
    } );

    casper.thenClick( "#project-bar-save", function() {

        this.wait(500, function() {
            this.echo("I've waited for a half second.");
            test.assertExists( "#project-bar-string-input-modal.in input", "Input modal of filename input modal" );
            test.assertExists( "#project-bar-string-input-modal.in [type='submit']", "Input modal of filename input modal" );
            casper.fill("#project-bar-string-input-modal.in", { "string-input": "testing01" }, false);
        });
    } );

    casper.thenClick( "#project-bar-string-input-modal.in [type='submit']", function() {

        test.assertExists( "#project-bar-new", "Input modal of filename input modal" );
    } );

    casper.thenClick( "#project-bar-new", function() {

        this.wait(500, function() {
            test.assertExists( "#project-bar-save", "Save button of project bar" );
        } );
    } );

    casper.thenClick( "#project-bar-save", function() {

        this.wait(500, function() {
            this.echo("I've waited for a half second.");
            test.assertExists( "#project-bar-string-input-modal.in input", "Input modal of filename input modal" );
            test.assertExists( "#project-bar-string-input-modal.in [type='submit']", "Input modal of filename input modal" );
            casper.fill("#project-bar-string-input-modal.in", { "string-input": "testing01" }, false);
        } );
    } );

    casper.thenClick( "#project-bar-string-input-modal.in [type='submit']", function() {
        this.wait(500, function() {
            this.echo("I've waited for a half second.");
            test.assertExists( "#project-bar-yes-no-modal.in", "Yes-No-Modal" );

            test.assertExists( "#project-bar-yes-no-modal.in button.modal-no", "Yes-No-Modal: No-Button" );
        } );
    } );

    casper.thenClick( "#project-bar-yes-no-modal.in button.modal-no", function() { 
        casper.fill(".scratchpad-ace-editor", { "text-input": "rect( 100, 100, 100, 101 );\n\n" }, false);
    } );
    casper.thenClick( "#project-bar-save", function() {

        this.wait(500, function() {
            this.echo("I've waited for a half second.");
            test.assertExists( "#project-bar-string-input-modal.in input", "Input modal of filename input modal" );
            test.assertExists( "#project-bar-string-input-modal.in [type='submit']", "Input modal of filename input modal" );
            casper.fill("#project-bar-string-input-modal.in", { "string-input": "testing01" }, false);
        } );
    } );

    casper.thenClick( "#project-bar-string-input-modal.in [type='submit']", function() {
        this.wait(500, function() {
            this.echo("I've waited for a half second.");
            test.assertExists( "#project-bar-yes-no-modal.in", "Yes-No-Modal" );
            test.assertExists( "#project-bar-yes-no-modal.in button.modal-yes", "Yes-No-Modal: No-Button" );
        } );
    } );

    casper.thenClick( "#project-bar-yes-no-modal.in button.modal-no", function() { 
    } );


    casper.run(function() {
        test.done();
    });
});
