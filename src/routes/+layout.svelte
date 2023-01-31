<slot />

<footer>
    <p>
        Page made by <a href="https://github.com/Giova978">Giova978</a>, you can find the source code on
        <a href="https://github.com/Giova978/MCpixelart">Github</a>.
    </p>
</footer>

<style lang="scss">
    footer {
        box-sizing: border-box;
        width: 100%;
        position: relative;
        bottom: 0;
        margin-top: 1rem;
        padding-bottom: 1rem;
        padding-left: 1rem;

        p {
            color: rgb(136, 136, 136);
        }
        a {
            color: rgb(21, 113, 69);
        }

        @media screen and (min-height: 850px) {
            margin-top: 0;
            position: absolute;
        }
    }
</style>
