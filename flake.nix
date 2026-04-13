{
  description = "A pokemon game with websockets";

  inputs = {
    default-pkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    moon-pkgs.url = "github:nixos/nixpkgs/1cb1c02a6b1b7cf67e3d7731cbbf327a53da9679";
  };

  outputs = { self, default-pkgs, moon-pkgs }: let

      # SUPPORTED SYSTEMS
      supportedSystems = [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];
      
      forAllSystems = default-pkgs.lib.genAttrs supportedSystems;

      nixpkgsFor = system : pkgs : import pkgs {
        inherit system;
        config.allowUnfree = true;
      };
    
  in
  {
    devShells = forAllSystems ( system: 
      let 
        defaultPkgs = nixpkgsFor system default-pkgs ;
        moonPkgs = nixpkgsFor system moon-pkgs;
      in 
      {
        default = defaultPkgs.mkShell {
          packages = [
            # task managers
            moonPkgs.moon
            # - NODE - for running tests
            defaultPkgs.nodejs 
            defaultPkgs.pnpm 
            # - Process orchestration
            defaultPkgs.process-compose
            defaultPkgs.coreutils
          ];
        };
      }
    ); 
  };
}
