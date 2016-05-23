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
            test.assertExists(".login-area a[href='/signup/']", "Signup Button " + i + " for " + name + i );
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

casper.test.begin('Login', 15, function suite(test) {

    var i = 0;

    (function login() {

        casper.start(url, function() {
            test.assertExists(".login-area a[href='/login/']", "Login Button " + " for " + name + i );
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
