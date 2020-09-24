const InvoiceBasedEscrow = artifacts.require('./InvoiceBasedEscrow.sol');

// Deploys, set up the contracts
module.exports = async function(deployer, network) {
  try {
    let erc20Address;
    if (network === "rinkeby") {
      erc20Address = "0xfab46e002bbf0b4509813474841e0716e6730136"; // FAU
    } else {
      erc20Address = "0x9FBDa871d559710256a2502A2517b794B482Db40"; // Test ERC20
    }
    await deployer.deploy(InvoiceBasedEscrow, erc20Address);
    console.log('InvoiceBasedEscrow Contract deployed: ' + InvoiceBasedEscrow.address);

    // ----------------------------------
    console.log('Contracts initialized');
    console.log(`
      InvoiceBasedEscrow:         ${InvoiceBasedEscrow.address}
    `);
  } catch (e) {
    console.error(e);
  }
};
