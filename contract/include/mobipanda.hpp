#include <eosiolib/eosio.hpp>
#include <eosiolib/asset.hpp>
#include <eosiolib/print.hpp>

#include <string>
//#include <vector>
//#include <time.h>

using namespace std;
using namespace eosio;

typedef uint64_t id_type;

CONTRACT mobipanda : public contract {
  public:
    using contract::contract;

    mobipanda(name receiver, name code, datastream<const char*> ds)
      : contract(receiver, code, ds), pandas(receiver, receiver.value), stats(receiver, receiver.value) {}

    /**
    * Create a new non-fungible token.
    *
    * @param issuer - Issuer of the token
    * @param maximum_supply - Maximum supply. "0 ${symbol}" means infinite supply
    * @param typ - token type. `0` coin, `1` nft
    */
    ACTION create(name issuer, asset maximum_supply, int typ);

    /**
    * Issues specified number of tokens with previously created symbol to the
    * account name "to".
    * Each token is generated with an unique token_id asiigned to it, and a URI
    * format string.
    *
    * @param to - Issuer of the token
    * @param symbol - Token symbol
    * @param memo - Action memo. Maximum 256 bytes
    */
    ACTION issuenft(name to, string symbol, string memo);

    /**
    * Transfer 1 nft with specified `id` from `from` to `to`.
    * Throws error if token with `id` does not exist, or `from` is no the token
    * owner.
    *
    * @param from - Account name of token owner
    * @param to - Account name of token receiver
    * @param id - ID of the token to transfer
    * @param memo - Action memo. Maximum 256 bytes
    */
    ACTION transfernft(name from, name to, id_type id, string memo);

  private:
    /*TABLE messages {
      name    user;
      string  text;
      auto primary_key() const { return user.value; }
    };
    typedef multi_index<name("messages"), messages> messages_table;*/
    TABLE panda {
      id_type id;
      name owner;
      asset value;
      string gene;
      //signature sign;

      id_type primary_key() const { return id; }
      uint64_t get_owner() const { return owner.value; }
      asset get_value() const { return value; }
      uint64_t get_symbol() const { return value.symbol.code().raw(); }
    };

    TABLE account {
      asset balance;
      uint64_t primary_key() const { return balance.symbol.code().raw(); }
    };

    TABLE stat {
      name issuer;        // DON'T MOFIFIED.
      asset supply;       // DON'T MODIFIED.
      asset issued;       // DON'T MODIFIED.
      public_key pubkey;  // DON'T MODIFIED.
      asset max_supply;   // DON'T MODIFIED.
      bool infinite;      // DON'T MODIFIED.
      int type;           // DON'T MODIFIED.

      uint64_t primary_key() const { return supply.symbol.code().raw(); }
      uint64_t get_issuer() const { return issuer.value; }
    };

    using account_index = eosio::multi_index<"accounts"_n, account>;

    using stat_index = eosio::multi_index<
        "stats"_n, stat,
        indexed_by<"byissuer"_n, 
            const_mem_fun<stat, uint64_t, &stat::get_issuer> > >;

    using panda_index = eosio::multi_index<
        "pandas"_n, panda,
        indexed_by<"byowner"_n, 
            const_mem_fun<panda, uint64_t, &panda::get_owner> >, 
        indexed_by<"bysymbol"_n, 
            const_mem_fun<panda, uint64_t, &panda::get_symbol> > >;
    
    panda_index pandas;
    stat_index stats;

    void mint(name owner, name ram_payer, asset value, string gene);
    void sub_balance(name owner, asset value);
    void add_balance(name owner, asset value, name ram_payer);
    void sub_supply(asset quantity);
    void add_supply(asset quantity);
};













