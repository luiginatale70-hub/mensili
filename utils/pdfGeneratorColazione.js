/**
 * pdfGeneratorColazione.js
 * Genera lettera + statino Colazione Obbligatoria Piloti
 */
const PDFDocument = require('pdfkit');
const path = require('path');
const fs   = require('fs');

const STEMMA_B64 = "iVBORw0KGgoAAAANSUhEUgAAANwAAAD9CAIAAABYyI5FAAAABmJLR0QA/wD/AP+gvaeTAAAgAElEQVR4nO2ddWBTV/vHz5V42qTu7i1FChQo7lKKu40JsLENNmD2430H2/vu3diQAWMbDNlwZ2gLpYK0WAWoUHd3iSf33t8f6UqbtunNTVIjn7/a5Nxznpt8c488z3kORBAEMGCgJwF3twEGDKhiEKWBHodBlAZ6HAZRGuhxGERpoMdhEKWBHodBlAZ6HAZRGuhxGESpGxTicoW4vLut6CMYRKkbBIW3BYW3u9uKPoJBlLpBWHBFWHClu63oI6DdbUBfAJPWiqteKv9AGCbdbU6vx/Ck1AHConAGB2ZwYGHx3e62pS9gEKUOEBRe4RpXcY0rBfmGHlwHGESpLbhCJCp7xuULuHyhqPwpLhd2t0W9HoMotUVYHElnwTSGgsZQ0FmwqDS6uy3q9RhEqS3CwqtcXrXyb65xlaDgavfa0wcwiFIrCFwmLLnP5QmU/3L4QmFxNIFJu9eq3o5BlFohKn2A0Ag6S6b8l8GSoXRIVBbTvVb1dgyi1ApBwXUur7blKxxetaDwWnfZ0zcwiFILCExYHM7lN7Z8jcsTCIvCCULRXUb1AQyipI6o/DEEKZjsViNIJkcKQXJxxdPusqoPYBAldYSFt7i8+ravc3n1woIbXW9Pn8EgSsoQgqKb7YqSw2sQFN0CwLChniIGUVJEUpVIKERMI0nbt9hcCaEQSaqed71VfQODKCkiKAzl8EVQu+9BgMMTCopudbFJfQaDKCkiLLjG5dV09C6XVyfIN7h2KGIQJRWkdWkKaTWb207frYRtLMaktdK69K60qs9gECUVBIWhHGMZBHc4lYEggmMsFRYaenAqGERJBWH+FTV9txIur0ZQ8HfX2NPHMIhSY+SN+TJBMdtYrL4YmyeWNRbLGnO7xqq+hEGUGiMoDGPzcBjB1ReDYZxtrBAW3ekaq/oSBlFqjKDgMte4ikxJLq/asEGCAgZRaoZCVCaty+TwOum7lXB4ImldhkJUpm+r+hgGUWqGoOgOywhCUIxMYQTFWUaQwNCDa4hBlJohzL/M5VWSL88xrjQkKdCUvpmMAJc3AqKTiQgFMHmjuDrJyk9E/hIuX1SV8lIuLEJoRjq3B0AwrI9qu5u+KUpx5bOyhx/hClIjP41gciGURqrvVoLSMAabyLs6WueWwCjLetQvHNsJOq+524H66pEl0tpXJdHLmcxyS/tyNa4XTYEgQtPaCBwiiPYjNyhA4FBFkaVEYmU77jTDxEdX1fYo+qwoAQAKcUXpvRUwlmnjXNDpsmKvAMfgsnwHBXCxHXcaZdt0tzn6oi+LEgBAYNLyRxsllRG2rvl0hry7zdEKuRQtyXGmm422DjoAoazuNkeP9HFRAgAAIKpf7q5PP2jjUsjqOK6nhyMRMkpyHYxcllgEfAOgPr5m8iaIEgAAGnLOVz7bauFQbmza2HnpHoagllNeYG0esI3nsbK7bekK3hRRAgDElXGl91Ybm1aY21QCnU089E5tuWlthZX1mMNsq6DutqWLeINECQCQN+aXRC+l0wqtHYt1OCXXEwQBlRfYSCR2tuNP043du9ucruPNEiUAAJPVld5fTYiTbF3ySXoLuwVMAZfmORE0H9uxxxGmWXeb06W8caIEABC4vOLJZnFpmK1rHp3ZE6fkcimtONuJaTneasR+CGF0tzldzZsoSiV1aUeqX/5g7VzM6Sxct4sRNbJKc+353uvM+m8CvWjwqzveXFECAAQFoeWPN5rZVPAt2skp0C3UVxtXFVlaDvvJyHlOd9vSbbzRogQASKqfl0SvMuKXW9hWdPtTqbrMvL7K0mbMnyzLod1sSrfyposSAKAQlZVEL0eIbBvnwu7yRuI4VJbvIMedbMedpnHsu8WGnoNBlAAAgCtEZQ/XKOqe2Lrmo/SuzuKnkCMlOc4Id5DNmKN9MhRNUwyi/AcCq4z7WpB/wca1QCW7n16RiuklOY4c+1kWQ3dAcN+MJNQUgyhbUZ91qirhGyunYi5Pg0heygjrWWX5dqZ+n5r4re+C5noLBlGqIiq9X/pwHd+iwsy6k3QDWlJXwa8us7QOOsCxn6TXhnodBlG2g7QuvSR6OZtdaulQCkG6/3wIACoLrYUCa9uxJxim/XRef2+njwdBUYPB97Ibf6ahio5jevl8cAVSX8m0m3DeoMh2MYiyfWT1GQwOXU/OcQTFGByarD5TH5X3AQyibB9hSQTHqFp/9bONaoQlhiNv28cgyvYRlUaxjfV49CfHSCgqjTTkRW8XgyjbQVqXjssbmRw9rlYyuVJcLpTVGXrwdjCs1r6GwPHqV69KYmKEJefsBwj1Me9uBoIIOq0x/uf1HLvFdiNHmvn4AKi7Xe89BoMogbCsLDc0NDcsLP/uXUlNDQBg3H+sjc31fmy3sbkIRZLvrI0AALDMzJwmTXKeNs1l2jSOtbW+m+7hvLnrlHXZ2ennz2dcvFiemAhafAgIAwo+7OjiX0xj6NcJLpehuS/tbq4pxCQtokAgyCogwHPBAu9Fi3iurno1oMfyxolSVFmZevz4qzNnyuPj2y1gPYg9fLOJ++DiLjAmK87u0e6a8sT2o4ythw71WbrUd+VKlrl5FxjTc3iDRFkeH//i0KHUEycUYnWh5gPfMfVfCKyc9etjbDIp3zTpHHh+TF1bCJ3uPnt2/7VrnSZOfEPGnX1flJhUmnbu3LMff6xKSSFTftqvdi6DazTdIyGT0AAAmu74ETawcuNNw9aTeirz3d0DPvqo/9q1KKsvp8cAfVuUktrahH37nv/6q6iiguQlHCt04i47j0EFGm3Ara80qsg3AQBYOtXyLDRIdkDgUGaiY8TmYmE52fEr28oq4KOPBn38MYPHI99Q76JvilIuECQeOPDkhx+kdXUaXegy2WjwGrazfznJ8pgCKckya6ygP/25CpMTwzdZGFnJ7TyryPsn815axR8W5YZrlreDxuUO+vDDYV991SeliWzfvr27bdAlmEwWv2fPtQULsq9fxyQaZw7yW8q3HyBhkVs2FzUyC1OtS+Kxh9+VC0rkkhosP0rAsmApEBMmV04nN3knACKVsQrva7YChctkxTExSYcPIzSa9ZAhEIJodHkPp089KfPv3o3cuLE6NZXa5TAKzTzi4Ny/tNOhIUFAVcW8mhLjl8dr8yNUH3J2wziD3jczsRZYOtV2ugIvk9DykmxvvFuAyyl+ESYeHqO++85r4UJql/dA+oibsTYz88LkyRcmT6asSACAqRcDgvFOFSmT0HJf2BQ9Z0V9UdpWkQCA4ifCyM9Lip4zcp7bSsV09bXRmXIIwsw8qGccqM3MvL5o0aXp0+tzcihX0qPo9d03rlAk7t9/fdGimnRtT+d0mWzkGIgZmaqbdzdUc4syLHPuip7urpI2dDhwlIvw/GgBASGoqTmMECyuuvGAXExrrEQrk7RKU1iXlfXyjz9gFLUZPhyCe/ezpnd335UvXoS+/XZFYqJOapuy19Y1sI7Lb393Tss5TdUrsgIycWcM32RhZCm38+pw9iOo5eQ8493ZWELR7tZYDR48/dgxc39/ndTWLfTanxRBxO3adXLYMF0pkslHWGY0llH7ahM1MnNf2BY8AuGbS8grEgBQmyW9u6Uk7yGe88JW2ND++iLbWMwyozFNdDNZKY+PPxkYmLB3L+i1j5teKUpBScmFKVOit2zBpDqLLrMcwEIRKdImGQFBQJVF/KJXVoVP7aSSJaO+3Wk9ZAj5aq2HDBn5n58U+NKCB45FryzL80zbJuWHERxFZJb+OlsSV0gkkZ98cnH6dGFZrzzsrPdFCRVGR19fvJj8ejhJbIeweFaqj0CZhFaaawfRXFzmHvVc5ax8sSAqiny1HBubIZs2Kf+WC4tK772Xn5ph41rMYMlaFuNZiW2HsgruC6jfQBvybt8+HhAQcu6c/WjdH5iiV3rZkzJu9+4LkyfrXJEQDCz6sVROS26oMSrMcGI7rnSYcZtm5Kx9KzSOvcP0G0YeHxVlONZVtFr0ZhuLzfuxdJ7LXFhaen7ixIS9e3Vcr57pNaJUSCQ3li2L3rwZV+g4ogyCYc+5gSgTaU6MgSmQklyH6nJ323EnLQZ/C8E0nbUFoWb9N9lNPF9X61mc7YQpmsaRTLYUZSIecwN1PnHG5fLITz65tWqVDoc6+qZ3iFJSU3Nx6tS0M2d0Wy3H2jrwiy/ezcgI2raEY6JQZl0TNTIL0l0hziTH4EiW5TDdtqiEaT7IcUYkwp+Rn+bSNPuBANdEPmrb0rX5+WN++MHY0VG3LaaeOHFuwgRRpQanSnYjvUCUdVlZp4YPL7p/X7fVDvjgg3WFhWN++IHv5iYqDuUY1RIEVF1mXprraDpgu82Yowid3+6FNDabfCsdRfTANK71yF8tA/eW5TtXFlsRBMQ2qhMWhxrZ2wd+8cV7WVkD1q2jclcdUxIbe3b06F6xwN7TRVmVlHR61KjaTN1vsMq8dEkuFAIAcFm9tDYLpSkKM1xEkoGO02/z3JepudBnxQrycY0ec+eqeZfrOMNxxh0pNqQg3RWlYdLaTExWBwBQSCRZ166RvhWy1KSnnx41imQIXzfSoxfPyxMSLk6dKq6q0lP9gZ9/PmbHDkHBzbKYjyEY5nuvMfXfTCb1WUFERNbVqwq1ozSETneeOtVt5sxOayNwRU3S7rq0Pwgcsx65n+sYfO/zz5/99JMGd6IJTBOT+aGhNsP0MjLRCT1XlCWxsZdmzJDW6zHxM0Knr05KktUcEpVFWQf9xrIM1F9bnSKueFoW+wHbejzD4oNjfn56nZcweLz5oaG2I0borwlt6KHdd1lcnL4VCQDAZLJ7X3wOo1zHGRHdq0gAAMsy0Cn4HsIwjd6yWd8zZWl9/aXp08sTEvTaCmV64pOyKinp3Pjx4mo9Zk1pBoLh9eXlPWdnlqyhYb+JCYF3RZZrlrn54uhocz+/LmhLI3rck7IuK+v85Mldo0gAAEKnI4wedFANwmDQOJyuaUtcVXVh8uQeOB/vWaIUV1dfnjlTVE52N4KWwDTahH376EY9KM04wmBM2LsXpulsuV49wtLSC1Om9LT1yx4kSoVE8vecOdqERUIwPHL7dpKuXqdJk1YlJvZfs4Zyc3qi39tvv52SQjKS3Hb48BFff62NH6guO/vaggU9yt/Tg8aUN5cvf3X6NOXLmSYmwadOuUyfXp6QcHLoUDXDMhNPz3G7dpFZrOleCiIiIj/5pCo5uaMCEAwve/TIJjAw+8aNWytXarpLriW+K1bMOHGC8uW6pac8KeN279ZGkaZeXiuePXOZPh0AYBUQ4LdqVbvFGHz+mB9+WJ2U1PMVCQBwnDhxVWLilIMHO5qH+b31lk1gIADAbebMFU+fmnh4UG4r9eTJnhO30SOelMUxMefGj8flFM/utA0Kmnv1astvTlReftjTU9bQ0PwKBMM+y5eP27mTbWmprbldjqSmJvabbxIPHCCw17HrdCOjd9PTOTY2LYtdnTev8N49aq3AKLooIsJ+zBhtzdWa7n9SCkpKrs6fT1mRXgsXLo6MVHmWsK2sRn/3XfO/juPHr0pImHH8eG9UJACAaWo6Ye/eVfHxjuPHN7846rvvWipSWWzB7dse8+ZRawVXKK4vWdIT4oK7+0lJEJeCg3NDQ6ld7bNs2fS//oLR9h2DuWFhJbGxtiNGKLv1vkHOrVuFUVHWgYEdzYQIDLv93nvJf/5JrX7nKVMWhIV1b9KibhZl3O7d0Zs3U7u2/5o1k3//vbfv3NMHBI7fWbcu6fBhapdP+PnngI0bdWuSRnSnKCtfvDg5bBi1xQi/VaumHTtmUGRHEDge+tZbqSdPUrgWZTJXPH3ajfshu+1LxRWK0LffpqZIr4ULpx09alCkGiAYnnbsGLXxpUIiCXvnnZaTqi6m277XZzt3Utsdaz969IwTJ/pY9hx9AKPozDNnWs6NyFMWFxf/8886N4kk3dN912Zm/jVggPrkpe3Cd3Nb/vhxz4mf6PmIq6tPBwXVZmRoeiGNzX7r5Uu+m5s+rFJP9zwp765fT0GRTBOTBbdvGxSpESwzs3k3bjD47W/tUINcJIr4+GN9mNQp3SDKrKtX8+9qfNgWBMMzTp7slh9ub8fEw2PGiRMUhuC5oaGUV+u0oatFiclk9z77jMKFI7Ztc50xQ+f2vCG4zZw5/F//onBh1KZNlP0alOlqUSbu309tF1jOjRslsbE6t+cNoTw+viAigsKFNWlpz3/9Vef2qKdLJzpygeAPV1fq0XsQ5LVgwbhdu4wcHHRqV19GWFoas3170pEjlJd4WObma3JyujLqtEuflHF79mgVT0oQ6RcuHPPzS9i3T3dG9WUS9u8/4uX18tAhbRYdxVVViQcO6NCqTum6J6W0ru6Qi4s2MX8tCTl/vi8lVNYHuaGhl3Q0CqfzeOvy8ihM4anRdU/KhH37dKVIAEDZ06e6qqqvUqy7Ibisvj6xC0eWXSRKhUSi2y7AgZKj4o3CLihIh7Ul7t/fZVsmukiUqceP6zB/n+P48YbloU5xmT6dmo+xXYRlZamnTumqNvV0iSgJQoeOVAhBxu/Zo6va+jbj9+zRYZBA/O7dXZOyuitEmR8RUf3qla5qG7B2rcWAAbqqrW9jMWCADrdrVqWkUN5roRFdIcqXf/yhq6qYJiYjv/1WV7W9CYz+7juWmZmuatPhV6kGvYtSVFmZ9fffuqotaNs2Q0CGRjBNTak5GNsl8/JlSY3eD53WuyhTjx/HZLLOy5HA1Nt74Pr1OqnqjWLQRx/pKmGQQiKhFs2uEXoXpTa7uVUYv3t3l+Uz6UvAKDpedxPNV7pO8t0W/YqyLjtb03xzAz/8kGNt3fZ1t5kz+9KmxC7GadIk1+Dgtq+zzMw6StzQEaVPnjTk5+vIrvbRryjTzp3TqDzH2nrCnj3vZWUFbduGMpnNryN0+tidO3Vt3ZvFhJ9/bplfDqbRAjZseC87e+qRIyr7xzuBINLPn9e9fS3QrygzL13SqHy/d96BaTQahxO0ffvqpCT3OXMgGGbweJMPHjT18tKTkW8IfHf3ifv2oUwmBMPus2e/k5o6Ye9eBo8Ho6jfypUaVZVx8aKejFSix4AMYWnpb3Z25JdbIRh+LzOT5+ra8kW5UAijaI9KIdmrkTU2YlKpygpGbWbmES8vjb6pD0pL9ZduRI9PytywMI0cAHYjR6ooEgBA43AMitQhdCOjtmtqJh4eykRZJCFwPO/OHZ3a1Qo9i1ITvBYt0pMlBjrFe/Fijcpr+uVqhL5ESeC4RrvDIBj2nD9fT8YY6BTPhQs12lmWf+eO/vzg+hJldWqqRkv/NsOGaTYHNKBTjOztrQICyJcXVVbWaL6XnCT6EqWmm7xcpk3TkyUGSKLpMnDxw4d6skRfoiyOidGovGFhvNvR9Lmg6VdMHn0dQv+b9AF9rBm/Wu6QJ+QIOtm1xDQxsRo8WE+WGCCJzbBhdGPjlumP2wWjIwILjtCEXVzwRE+9my5FWSuoCYu/fifxVnphisAMB2ZcAMDTMSaoguA2KGwLxTaFEtsiMdQmQ75tUJAhhVq3AyGI7fDhna71iPis/MH2yr+rSgvNbXS/3Vk3opTKpXuv7jh3/ySKIGKZapIgBQrVmdLq+Wi6nxGCER6pjf0SGxiS19q0GzlSJ2YY0BK7kSM7FSW7TgwBoJx4v4y+PWHpezo3QwfPJ4G4cdmPsy48PC3HZG0V2QwBQxgKyRhwWn/exVX2qQOMmlcUbIYP194MA9pjS2KvGSLD6MKmWMSMxMf6MEMHovzqr0/zK/OkcgnJ8hgCMBRKHGZyN8QKQyEAgKVhe0PPgOQ+E1Zt06Mnr0j357AD7bvvoqqCh6nRGKbQ9EIMhSpsGOEhVvPiaUxTUy3NMKAT2BYWHBsbYWlpJ8XqxHX2PABAlaguIvRsVvqLsuJcoaDRytZx0oylAwZre+iJtqJMyHrGQBkizUUJAMBQqNqCnj7aSksbDOgQC3//TkVJFzV13zJCceboTzJZUydZVpKf+uLxyrVbx01ZoI0N2nbfBNDK14Sh0H1elUgq1NIMA7qC7+6u5l0pl1440LZgyOsZd7MiAQAAEHK57OxfOwlCq6OhtRXlINfBMrlWiRNoEPI4TV/LsAY0hefsrObdGieTOgc+Dqs7ZUckaGyor9XGBm27b0dLl/4uAS/zEhSUenAAAI5hD3b9IJQ0HfoCoah7SIj30qVaGmaADNk3bqSdOdMyLWpjUZH6Swj9H/ukg3XKb1f+uPB/0xU4Ri1sBMexhqhH6UWve4G0M2doXK5bSIj2thlQQ/7du1dmzdJ5sA8MwSw2R6satDfC0cL50IZTDBoDgalkCKHJcOti1eUkvcaQGlCSfe2aPsLPLG2d6HRm5+U6RjfOvQEuARe/CnWwcGLQNLGGAAhGjAurhNp8MrraKm5ADQo9ZFFDYMTXX4Mg9nbRmcfZydLl8tY7K8a/Q7I8osCZEmzK1XKLsi5KMGegK4BhLdeDgG4DMlAE9XFoysQAEQDBCBwGiILAYYiAIQAAjBMQTihoELdB4Z3U6JkqQBTdf9q4AV0BI4iru5+zm6+W9eg4dK2stmndlduomHOquM6U1sijCY1QDAYAAAQjjOsVJlUytrDbzv0zoC0EAB1MwGEIfucjHaQf040oBRLB8+y4V4XJYfHXlK/I6HDcSBNercKmSOyYI9JJKwa6HX5RfYO1sZyJ4oiqMFGUvmLNF3YOOjh9SytRSmTi2wk3z94/nlqQzKQxMRyTKZoGiFImnOZvjChwDDE1apAPeFbvnCVsO6Ehz/APfiisaH9J1tSYY2vGszQxZjPpTDqNxaDREEQkkUlkcrFMVtcoLq6qK6upV2BauRl0CIOG2przbcx4PA6LxaApbZbKFWKJTCJTCMTSspr64qo6gViXo21HS9NHv32hZSWseolnVFalq2mVuxlGQ5VrljCC0FD66g++Hjl+lg4MpSxKHMcuPDyz//pPMoVMIhMDAMQy1cchAQEFDQYANPBpsePNMny548IqGVKKyuAwW+3+NjFi93Ox83a0srMwYTE6z3qFYXhZTUNmUUVSTnFRpVb+BmrQUMTLwcrX2dbZ2tTMmNtRD9iSOoG4oLw6Kaf4VX6ZXKHtgIfD0s32eQgnLLOqLbKrC4Y41NsYAQCsbRy37zzHZGm1NtkSKqKsrC/f9Mf76UWvJOTD1VCoypoREWI5/XJZ28hzMig/UyMWc6iPs7+rna05T6PLEQS2s+DbWfDHDfKsaRAm5RTHJufUCfQ+roAhyM/FdqCHg5eDFQ3VbB2Xz2Xxufb93ezlCiytoCwuLT+9sJxyRhOujkSpBCIAq1asFCWOEzpUJKAgyrLa0mU/zq4X1coVmh3ZhyFQrSk924vr/kqgaaMAAAcLExcb8wAPBwRptYxVXS8oqaovqa4XiKQiqUwslWE4oewTWXSalYmxvQXfzsLE2tRYea2pMWfsQM/R/T2eZxVGJaZX1DZSsKdTGDQ00MclqJ+rqXGrL0wslRdX1ZVU1ZVU1dc0CMRSuVgqlyoUNARmMegsBo3PZdua8+zMTewt+MqfIg1F/F3t/F3tSqvroxPTX2YX45pL04it40QjNFmTY1nQWAcAIAi8tLivirKwsjIyM6OjpnxCkAAACAAQAA//9w3gF4AAAAAElFTkSuQmCC";
const STEMMA_BUF = Buffer.from(STEMMA_B64, 'base64');

const mm = v => v * 2.834645669;

const PG_W = mm(210), PG_H = mm(297);
const MAR_L = mm(17), MAR_R = mm(17), MAR_T = mm(10);
const BODY_W = PG_W - MAR_L - MAR_R;

const F = 'Helvetica', FB = 'Helvetica-Bold', FBO = 'Helvetica-BoldOblique';

function docToBuffer(doc){
  return new Promise((resolve,reject)=>{
    const chunks=[];
    doc.on('data',c=>chunks.push(c));
    doc.on('end',()=>resolve(Buffer.concat(chunks)));
    doc.on('error',e=>reject(e));
  });
}

function solidLine(doc,x1,y,x2,lw=0.5){
  doc.save().moveTo(x1,y).lineTo(x2,y).lineWidth(lw).stroke('#000').restore();
}

function dashedLine(doc,x1,y,x2,lw=0.5){
  doc.save().moveTo(x1,y).lineTo(x2,y).lineWidth(lw).dash(3,{space:3}).stroke('#000').undash().restore();
}

function border(doc,x,y,w,h,lw=0.4){
  doc.save().rect(x,y,w,h).lineWidth(lw).stroke('#000').restore();
}

function disegnaFirma(doc, dati, xCorpo, wCorpo, yDx){
  if(dati.firmaAssente){
    doc.font(FB).fontSize(11).text('P. IL CAPO NUCLEO', xCorpo, yDx, {width:wCorpo, align:'center'});
    yDx+=mm(6);
    doc.text(dati.sostituito+' t.a.', xCorpo, yDx, {width:wCorpo, align:'center'});
    yDx+=mm(6);
    doc.text(dati.sostituto, xCorpo, yDx, {width:wCorpo, align:'center'});
  } else {
    doc.font(FB).fontSize(11).text('IL CAPO NUCLEO', xCorpo, yDx, {width:wCorpo, align:'center'});
    yDx+=mm(6);
    doc.text(dati.capoNucleo, xCorpo, yDx, {width:wCorpo, align:'center'});
  }

  yDx+=mm(10);

  const bW=mm(70), bH=mm(14);
  const bX=xCorpo+(wCorpo-bW)/2;

  border(doc,bX,yDx,bW,bH,0.5);

  doc.font(F).fontSize(7).fillColor('#333')
     .text('Documento informatico firmato digitalmente ai sensi del\nD.P.R. 28 dicembre 2000, n. 445 e D.Lgs 7 marzo 2005, n. 82.',
           bX+mm(2), yDx+mm(2), {width:bW-mm(4), align:'center'});

  return yDx+bH;
}

function intestazione(doc, dati){
  const stemmaExt=path.join(__dirname,'..','public','images','stemma.png');
  const stemmaBuf=fs.existsSync(stemmaExt)?stemmaExt:STEMMA_BUF;

  doc.image(stemmaBuf, mm(45), mm(10), {width:mm(25), height:mm(22)});

  const xR=mm(130), wR=PG_W-xR-MAR_R;

  doc.font(F).fontSize(11)
     .text('p.d.c.: NAAF  085/4311255', xR, mm(8), {width:wR});

  doc.font('Helvetica-Oblique').fontSize(12)
     .text('Ministero delle Infrastrutture e dei Trasporti', MAR_L, mm(34), {width:mm(100), align:'center'});

  doc.font(F).fontSize(11)
     .text('Capitaneria di porto di Pescara', MAR_L, mm(40), {width:mm(100), align:'center'});

  dashedLine(doc, MAR_L, mm(45), MAR_L+mm(100));

  doc.text('Nucleo Addestramento Ala Fissa', MAR_L, mm(48), {width:mm(100), align:'center'});

  doc.text('Indirizzo mail: naaf@mit.gov.it', MAR_L, mm(58), {width:mm(100)});

  doc.text('Prot. n° '+(dati.protocollo||'__.__.__/_______')+' - Allegati: 1', MAR_L, mm(64), {width:mm(100)});

  doc.text('Al', xR, mm(40));
  doc.font(FB).text('DIREZIONE MARITTIMA', xR+mm(10), mm(40));
  doc.font(F).text('Segreteria Gestione', xR, mm(46));
  doc.text('Contabile del personale', xR, mm(52));
}

async function generaLettera(dati){
  const doc=new PDFDocument({size:[PG_W,PG_H], margin:0});
  const buf=docToBuffer(doc);

  intestazione(doc, dati);

  solidLine(doc, MAR_L, mm(75), PG_W-MAR_R);

  doc.font(FB).fontSize(11).text('Argomento:', MAR_L, mm(80));
  doc.font(FBO).text('Colazione obbligatoria Piloti N.A.A.F.- Mese di '+dati.meseNome+' '+dati.anno+'.',
    MAR_L+mm(28), mm(80), {width:BODY_W-mm(28)});

  solidLine(doc, MAR_L, mm(90), PG_W-MAR_R);

  const xCorpo=MAR_L+mm(30);
  const wCorpo=PG_W-MAR_R-xCorpo;
  let yDx=mm(92);

  doc.font(F).fontSize(11).text('Riferimenti:', xCorpo, yDx);
  yDx+=mm(6);

  doc.text('a) SMM 20 Edizione 2019 art. 10 para 4 e 6;', xCorpo, yDx);
  yDx+=mm(5);

  doc.text('b) Fg. n° 23859 del 19/08/2019 della Direzione Marittima di Pescara.', xCorpo, yDx);
  yDx+=mm(10);

  doc.text('Si trasmette, in allegato come richiesto dal Riferimento b), il computo dei giorni di effettiva presenza per attività di volo.', xCorpo, yDx, {width:wCorpo});
  yDx+=mm(10);

  doc.text('Con l’occasione si rappresenta che il citato statino non contempla il servizio effettivo svolto.', xCorpo, yDx, {width:wCorpo});
  yDx+=mm(10);

  doc.text('Si rimane a disposizione.', xCorpo, yDx);

  yDx+=mm(10);

  disegnaFirma(doc, dati, xCorpo, wCorpo, yDx);

  doc.end();
  return buf;
}

async function generaStatino(dati){
  const doc=new PDFDocument({size:[PG_W,PG_H], margin:0});
  const buf=docToBuffer(doc);

  let y=MAR_T+mm(5);

  doc.font(FB).fontSize(11).text('DIREZIONE MARITTIMA', MAR_L, y, {width:BODY_W, align:'center'});
  y+=mm(5);

  doc.text('PESCARA', MAR_L, y, {width:BODY_W, align:'center'});
  y+=mm(5);

  doc.text('Nucleo Addestramento Ala Fissa', MAR_L, y, {width:BODY_W, align:'center'});
  y+=mm(8);

  doc.text('SERVIZIO DI VETTOVAGLIAMENTO', MAR_L, y, {width:BODY_W, align:'center'});
  y+=mm(5);

  doc.text('COLAZIONE OBBLIGATORIA', MAR_L, y, {width:BODY_W, align:'center'});
  y+=mm(8);

  const cols=[mm(40),mm(45),mm(50),mm(25)];
  let x=MAR_L;

  ['GRADO','COGNOME','NOME','SPETTANZA'].forEach((h,i)=>{
    border(doc,x,y,cols[i],mm(8));
    doc.text(h,x+2,y+2,{width:cols[i]-4,align:'center'});
    x+=cols[i];
  });

  y+=mm(8);

  (dati.piloti||[]).forEach(p=>{
    let x2=MAR_L;
    [p.grado,p.cognome,p.nome,p.spettanza].forEach((v,i)=>{
      border(doc,x2,y,cols[i],mm(7));
      doc.text(String(v||''),x2+2,y+2,{width:cols[i]-4});
      x2+=cols[i];
    });
    y+=mm(7);
  });

  y+=mm(10);

  disegnaFirma(doc, dati, MAR_L+BODY_W*0.5, BODY_W*0.5, y);

  doc.end();
  return buf;
}

async function genera(template, dati){
  switch(template){
    case 'colazione-lettera': return generaLettera(dati);
    case 'colazione-statino': return generaStatino(dati);
    default: throw new Error('Template colazione sconosciuto: '+template);
  }
}

module.exports = { genera };