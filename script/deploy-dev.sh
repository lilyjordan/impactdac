#!/bin/bash

forge script DAC.s.sol --fork-url http://localhost:8545 --broadcast --out ../frontend/artifacts;
cp ../broadcast/DAC.s.sol/31337/run-latest.json ../frontend/public;

# Compile enum mappings to use as a single source of truth

json_data=$(cat ../frontend/artifacts/DAC.sol/DAC.json)
enum_definitions=$(echo $json_data | jq -c '[.ast.nodes[] | select(.nodes? and any(.nodes[]; .nodeType == "EnumDefinition"))]')

output="{}"

for node in $(echo "${enum_definitions}" | jq -r '.[] | @base64'); do
    _jq() {
        echo ${node} | base64 --decode | jq -r ${1}
    }

    decoded_node=$(echo ${node} | base64 --decode)
    enum_nodes=$(echo $decoded_node | jq -c '.nodes | map(select(.nodeType == "EnumDefinition"))')

    for enum_node in $(echo "${enum_nodes}" | jq -r '.[] | @base64'); do
        _jq2() {
            echo ${enum_node} | base64 --decode | jq -r ${1}
        }

        name=$(_jq2 '.name')
        members=$(_jq2 '.members')

        mapping="{"
        index=0
        for member in $(echo "${members}" | jq -r '.[] | @base64'); do
            _jq3() {
                echo ${member} | base64 --decode | jq -r ${1}
            }

            memberName=$(_jq3 '.name')
            mapping+="\"${index}\": \"${memberName}\", "
            index=$((index+1))
        done
        mapping=${mapping%,*}  # Remove trailing comma
        mapping+="}"

        complete_mapping="{\"${name}\": ${mapping}}"
        output=$(echo "$output" | jq --argjson complete_mapping "$complete_mapping" '. + $complete_mapping')
    done
done

echo $output > ../frontend/public/enum_definitions.json