import clsx from 'clsx';

const FeatureList = [
    {
        title: 'Public Data',
        Svg: require('@site/static/img/public-data-icon.svg').default,
        description: (
            <>
                Store documents and files that anyone can access. Content is stored as-is and available at a public link
                — no authentication required to retrieve it.
            </>
        ),
    },
    {
        title: 'Private Data',
        Svg: require('@site/static/img/private-data-icon.svg').default,
        description: (
            <>
                Automatically encrypt sensitive data before storage. You receive the only decryption key; without it,
                nobody — including the server — can read your data.
            </>
        ),
    },
    {
        title: 'Flexible Storage',
        Svg: require('@site/static/img/flexible-deployment-icon.svg').default,
        description: (
            <>
                Works with AWS S3, Google Cloud, or any S3-compatible provider. Switch storage backends without changing
                your integration.
            </>
        ),
    },
    {
        title: 'Data Integrity',
        Svg: require('@site/static/img/data-integrity-icon.svg').default,
        description: (
            <>
                Every upload produces a unique hash — a fingerprint you can use later to verify your data has not been
                tampered with.
            </>
        ),
    },
];

function Feature({ Svg, title, description }) {
    return (
        <div className={clsx('col col--3 home-feature')}>
            <div className="home-feature__content">
                <div className="home-feature__head">
                    <div className="home-feature__image">
                        <Svg className="home-feature__icon" role="img" />
                    </div>
                    <h3 className="home-feature__title">{title}</h3>
                </div>
                <p className="home-feature__description">{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures() {
    return (
        <section className="home-features">
            <div className="home-features__container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
