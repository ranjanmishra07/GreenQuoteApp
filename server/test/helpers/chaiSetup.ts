//
// Import and configure chai
//
import * as chai from "chai";
import chaiAsPromised = require("chai-as-promised");
import * as sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);

chai.config.includeStack = true;